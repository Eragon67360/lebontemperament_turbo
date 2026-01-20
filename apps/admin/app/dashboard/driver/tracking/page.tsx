"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { AlertCircle, MapPin, Play, RefreshCw, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Delivery {
  id: string;
  driver_id: string;
  public_token: string;
  latitude: number | null;
  longitude: number | null;
  is_tracking_active: boolean;
  expires_at: string;
}

export default function DriverTrackingPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const useHighAccuracyRef = useRef<boolean>(true);
  const router = useRouter();
  const supabase = createClient();

  // Check authorization and load delivery on mount
  useEffect(() => {
    async function initialize() {
      console.log("[Tracking] Initializing tracking page...");
      try {
        // Check if user is authorized (we'll do a client-side check)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.log("[Tracking] No user found, redirecting to login");
          router.push("/auth/login");
          return;
        }

        console.log("[Tracking] User authenticated:", user.id);

        // Check superadmin role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "superadmin") {
          console.warn(
            "[Tracking] Unauthorized access attempt. Role:",
            profile?.role,
          );
          setError(
            "Vous n'êtes pas autorisé à accéder à cette page. Rôle superadmin requis.",
          );
          setIsLoading(false);
          return;
        }

        console.log("[Tracking] User authorized as superadmin");

        // Load or create delivery
        console.log("[Tracking] Loading existing delivery for user:", user.id);
        const { data: existingDelivery, error: fetchError } = await supabase
          .from("deliveries")
          .select("*")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 is "no rows returned", which is fine
          console.error("[Tracking] Error fetching delivery:", fetchError);
          setError("Erreur lors du chargement de la livraison.");
          setIsLoading(false);
          return;
        }

        if (existingDelivery) {
          console.log("[Tracking] Found existing delivery:", {
            id: existingDelivery.id,
            token: existingDelivery.public_token,
            isTrackingActive: existingDelivery.is_tracking_active,
            expiresAt: existingDelivery.expires_at,
            hasPosition: !!(
              existingDelivery.latitude && existingDelivery.longitude
            ),
          });
          setDelivery(existingDelivery);
          setIsTracking(existingDelivery.is_tracking_active);
          if (existingDelivery.latitude && existingDelivery.longitude) {
            setPosition({
              lat: existingDelivery.latitude,
              lng: existingDelivery.longitude,
            });
            console.log("[Tracking] Restored position:", {
              lat: existingDelivery.latitude,
              lng: existingDelivery.longitude,
            });
          }
        } else {
          // Create a new delivery
          console.log(
            "[Tracking] No existing delivery found, creating new one...",
          );
          const publicToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

          const { data: newDelivery, error: createError } = await supabase
            .from("deliveries")
            .insert({
              driver_id: user.id,
              public_token: publicToken,
              expires_at: expiresAt.toISOString(),
              is_tracking_active: false,
            })
            .select()
            .single();

          if (createError) {
            console.error("[Tracking] Error creating delivery:", createError);
            setError("Erreur lors de la création de la livraison.");
            setIsLoading(false);
            return;
          }

          console.log("[Tracking] Created new delivery:", {
            id: newDelivery.id,
            token: newDelivery.public_token,
            expiresAt: newDelivery.expires_at,
          });
          setDelivery(newDelivery);
        }

        console.log("[Tracking] Initialization complete");
        setIsLoading(false);
      } catch (err) {
        console.error("[Tracking] Error initializing:", err);
        setError("Une erreur est survenue.");
        setIsLoading(false);
      }
    }

    initialize();
  }, [router, supabase]);

  // Update position in database
  const updatePosition = async (lat: number, lng: number) => {
    if (!delivery) {
      console.warn("[Tracking] Cannot update position: no delivery");
      return;
    }

    const timestamp = new Date().toISOString();
    console.log("[Tracking] Updating position in database:", {
      deliveryId: delivery.id,
      latitude: lat,
      longitude: lng,
      timestamp,
    });

    const { error } = await supabase
      .from("deliveries")
      .update({
        latitude: lat,
        longitude: lng,
        updated_at: timestamp,
      })
      .eq("id", delivery.id);

    if (error) {
      console.error("[Tracking] Error updating position in database:", error);
    } else {
      console.log("[Tracking] Position updated successfully in database");
      setPosition({ lat, lng });
    }
  };

  // Start tracking
  const startTracking = async () => {
    if (!delivery) {
      console.warn("[Tracking] Cannot start tracking: no delivery");
      return;
    }

    console.log("[Tracking] Starting tracking for delivery:", delivery.id);

    if (!navigator.geolocation) {
      console.error("[Tracking] Geolocation not supported by browser");
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    // Update database to set tracking as active
    console.log("[Tracking] Setting is_tracking_active to true in database");
    const { error: updateError } = await supabase
      .from("deliveries")
      .update({ is_tracking_active: true })
      .eq("id", delivery.id);

    if (updateError) {
      console.error(
        "[Tracking] Error starting tracking in database:",
        updateError,
      );
      setError("Erreur lors du démarrage du suivi.");
      return;
    }

    console.log("[Tracking] Tracking activated in database");
    setIsTracking(true);
    setError(null);

    // Helper function to handle geolocation errors
    const handleGeolocationError = (err: GeolocationPositionError) => {
      // Error codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
      console.warn("[Tracking] Geolocation error:", {
        code: err.code,
        message: err.message,
        codeName:
          err.code === 1
            ? "PERMISSION_DENIED"
            : err.code === 2
              ? "POSITION_UNAVAILABLE"
              : "TIMEOUT",
      });

      // Only show critical errors to the user
      if (err.code === 1) {
        // PERMISSION_DENIED
        console.error("[Tracking] Permission denied - stopping tracking");
        setError(
          "Permission de géolocalisation refusée. Veuillez autoriser l'accès à votre position.",
        );
        stopTracking();
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        console.error("[Tracking] Position unavailable");
        setError("Position indisponible. Vérifiez que votre GPS est activé.");
      } else if (err.code === 3) {
        // TIMEOUT
        console.log(
          "[Tracking] Geolocation timeout (this is normal in some conditions)",
        );
        // Timeout errors are common and shouldn't be shown as critical
        // If we keep getting timeouts, try disabling high accuracy
        if (useHighAccuracyRef.current) {
          console.log(
            "[Tracking] Switching to lower accuracy mode due to timeouts",
          );
          useHighAccuracyRef.current = false;
          // Restart watching with lower accuracy
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            console.log(
              "[Tracking] Restarting watchPosition with lower accuracy",
            );
            watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                updatePosition(latitude, longitude);
              },
              handleGeolocationError,
              {
                enableHighAccuracy: false,
                maximumAge: 10000, // Accept cached positions up to 10 seconds old
                timeout: 15000,
              },
            );
          }
        }
        // Don't show timeout errors to user, they're temporary
      }
    };

    // Get initial position
    console.log(
      "[Tracking] Requesting initial position (highAccuracy:",
      useHighAccuracyRef.current,
      ")",
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("[Tracking] Initial position received:", {
          latitude,
          longitude,
          accuracy: `${accuracy}m`,
        });
        updatePosition(latitude, longitude);
      },
      handleGeolocationError,
      {
        enableHighAccuracy: useHighAccuracyRef.current,
        maximumAge: useHighAccuracyRef.current ? 0 : 10000,
        timeout: 15000, // Increased to 15 seconds
      },
    );

    // Watch position changes
    console.log(
      "[Tracking] Starting watchPosition (highAccuracy:",
      useHighAccuracyRef.current,
      ")",
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("[Tracking] Position update from watchPosition:", {
          latitude,
          longitude,
          accuracy: `${accuracy}m`,
        });
        updatePosition(latitude, longitude);
        // Clear any previous errors on successful position update
        if (error && error.includes("Position indisponible")) {
          console.log("[Tracking] Clearing position unavailable error");
          setError(null);
        }
      },
      handleGeolocationError,
      {
        enableHighAccuracy: useHighAccuracyRef.current,
        maximumAge: useHighAccuracyRef.current ? 0 : 10000,
        timeout: 15000, // Increased to 15 seconds
      },
    );
    console.log(
      "[Tracking] watchPosition started with watchId:",
      watchIdRef.current,
    );

    // Also update periodically (every 10 seconds) as a backup
    console.log(
      "[Tracking] Starting periodic position updates (interval: 10s)",
    );
    updateIntervalRef.current = setInterval(() => {
      console.log("[Tracking] Periodic position check triggered");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log("[Tracking] Position update from interval:", {
            latitude,
            longitude,
            accuracy: `${accuracy}m`,
          });
          updatePosition(latitude, longitude);
        },
        (err) => {
          // Only log non-timeout errors in interval (code 3 = TIMEOUT)
          if (err.code !== 3) {
            handleGeolocationError(err);
          } else {
            console.log("[Tracking] Periodic check timeout (silent)");
          }
        },
        {
          enableHighAccuracy: useHighAccuracyRef.current,
          maximumAge: useHighAccuracyRef.current ? 0 : 10000,
          timeout: 15000,
        },
      );
    }, 10000); // Increased interval to 10 seconds
    console.log("[Tracking] Tracking started successfully");
  };

  // Stop tracking
  const stopTracking = async () => {
    if (!delivery) {
      console.warn("[Tracking] Cannot stop tracking: no delivery");
      return;
    }

    console.log("[Tracking] Stopping tracking for delivery:", delivery.id);

    // Stop watching position
    if (watchIdRef.current !== null) {
      console.log(
        "[Tracking] Clearing watchPosition (watchId:",
        watchIdRef.current,
        ")",
      );
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear interval
    if (updateIntervalRef.current !== null) {
      console.log("[Tracking] Clearing periodic update interval");
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Update database to set tracking as inactive
    console.log("[Tracking] Setting is_tracking_active to false in database");
    const { error } = await supabase
      .from("deliveries")
      .update({ is_tracking_active: false })
      .eq("id", delivery.id);

    if (error) {
      console.error("[Tracking] Error stopping tracking in database:", error);
      setError("Erreur lors de l'arrêt du suivi.");
      return;
    }

    console.log("[Tracking] Tracking stopped successfully");
    setIsTracking(false);
  };

  // Reset token and extend expiration
  const resetToken = async () => {
    if (!delivery) {
      console.warn("[Tracking] Cannot reset token: no delivery");
      return;
    }

    console.log("[Tracking] Resetting token for delivery:", delivery.id);
    console.log("[Tracking] Old token:", delivery.public_token);

    const newToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    console.log("[Tracking] New token:", newToken);
    console.log("[Tracking] New expiration:", expiresAt.toISOString());

    const { data: updatedDelivery, error } = await supabase
      .from("deliveries")
      .update({
        public_token: newToken,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", delivery.id)
      .select()
      .single();

    if (error) {
      console.error("[Tracking] Error resetting token:", error);
      setError("Erreur lors de la réinitialisation du token.");
      return;
    }

    console.log("[Tracking] Token reset successfully");
    setDelivery(updatedDelivery);
    setError(null);
  };

  // Helper function to get website URL
  const getWebsiteUrl = () => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    // In development, admin might be on 3001 and website on 3000
    // In production, they might be on different subdomains
    if (
      origin.includes("localhost:3001") ||
      origin.includes("127.0.0.1:3001")
    ) {
      return origin.replace(":3001", ":3000");
    }
    if (origin.includes("admin")) {
      return origin.replace("admin", "www").replace("admin.", "");
    }
    // Fallback: try to use env variable (available at build time)
    return (
      process.env.NEXT_PUBLIC_WEBSITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      origin
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[Tracking] Component unmounting, cleaning up...");
      // The stopTracking function already clears watchers and intervals
      // and sets is_tracking_active to false in the DB.
      // Check if the component thinks it is tracking before stopping.
      if (isTracking) {
        stopTracking();
      } else {
        // If not tracking, just clear any dangling refs
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        if (updateIntervalRef.current !== null) {
          clearInterval(updateIntervalRef.current);
        }
      }
    };
    // Add dependencies to ensure the latest versions of functions are used
  }, [isTracking, stopTracking]);

  if (isLoading) {
    return (
      <PageShell
        title="Suivi de livraison"
        description="Gérez le suivi de votre livraison"
      >
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">Chargement...</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (error && !delivery) {
    return (
      <PageShell
        title="Suivi de livraison"
        description="Gérez le suivi de votre livraison"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Suivi de livraison"
      description="Activez le suivi pour partager votre position en temps réel"
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Contrôle du suivi</CardTitle>
            <CardDescription>
              {isTracking
                ? "Le suivi est actif. Votre position est mise à jour en temps réel."
                : "Démarrez le suivi pour partager votre position avec les clients."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={startTracking}
                disabled={isTracking}
                size="lg"
                className="flex-1"
              >
                <Play className="h-4 w-4" />
                Démarrer le suivi
              </Button>
              <Button
                onClick={stopTracking}
                disabled={!isTracking}
                variant="destructive"
                size="lg"
                className="flex-1"
              >
                <Square className="h-4 w-4" />
                Arrêter le suivi
              </Button>
            </div>

            {isTracking && position && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="text-primary h-4 w-4" />
                  <span className="font-medium">Position actuelle:</span>
                </div>
                <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                  <p>Latitude: {position.lat.toFixed(6)}</p>
                  <p>Longitude: {position.lng.toFixed(6)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {delivery && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informations de livraison</CardTitle>
                  <CardDescription>
                    Partagez ces informations avec vos clients
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                      Réinitialiser le token
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Réinitialiser le token
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action va générer un nouveau token public et
                        réinitialiser la date d'expiration à 24 heures à partir
                        de maintenant. L'ancien token ne sera plus valide et les
                        clients devront utiliser la nouvelle URL.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={resetToken}>
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Token public</label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded-md border px-3 py-2 font-mono text-sm">
                    {delivery.public_token}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(delivery.public_token);
                    }}
                  >
                    Copier
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  URL de suivi client
                </label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded-md border px-3 py-2 font-mono text-sm break-all">
                    {typeof window !== "undefined"
                      ? `${getWebsiteUrl()}/track/${delivery.id}?token=${delivery.public_token}`
                      : ""}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const url = `${getWebsiteUrl()}/track/${delivery.id}?token=${delivery.public_token}`;
                        navigator.clipboard.writeText(url);
                      }
                    }}
                  >
                    Copier
                  </Button>
                </div>
              </div>
              <div className="text-muted-foreground text-sm">
                <p>
                  Expire le:{" "}
                  {new Date(delivery.expires_at).toLocaleString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
