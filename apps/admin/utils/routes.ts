const RouteNames = {
  AUTH: {
    LOGIN: "/auth/login",
    RESET_PASSWORD: "/auth/reset-password",
    UPDATE_PASSWORD: "/auth/update-password",
  },
  DASHBOARD: {
    ROOT: "/dashboard",
    ADMIN: {
      BUG_REPORTS: "/dashboard/admin/bug-reports",
      USERS: "/dashboard/admin/users",
      /** One member's page. */
      USER: (id: string) => `/dashboard/admin/users/${encodeURIComponent(id)}`,
      USERS_SYNC: "/dashboard/admin/users/sync",
      /** « Groupes »: the CA, the commissions… */
      GROUPS: "/dashboard/admin/groups",
      /** One group's page. */
      GROUP: (id: string) =>
        `/dashboard/admin/groups/${encodeURIComponent(id)}`,
      CA: "/dashboard/admin/ca",
      DOCUMENTS: "/dashboard/admin/documents",
      ASSEMBLIES: "/dashboard/admin/assemblies",
      GOOGLE_GROUPS: "/dashboard/admin/google-groups",
      /** « Commandes »: the association's sales (superadmins only). */
      ORDERS: "/dashboard/admin/commandes",
      /** One sale's page. */
      ORDER_SALE: (id: string) =>
        `/dashboard/admin/commandes/${encodeURIComponent(id)}`,
      ANNIVERSARY: {
        ROOT: "/dashboard/admin/anniversary",
        HERO: "/dashboard/admin/anniversary/hero",
        HERO_STATS: "/dashboard/admin/anniversary/hero-stats",
        NAVIGATION: "/dashboard/admin/anniversary/navigation",
        TIMELINE: "/dashboard/admin/anniversary/timeline",
        VIDEOS: "/dashboard/admin/anniversary/videos",
        AUDIO: "/dashboard/admin/anniversary/audio",
        PHOTOS: "/dashboard/admin/anniversary/photos",
        ARCHIVES: "/dashboard/admin/anniversary/archives",
        FORM: "/dashboard/admin/anniversary/form",
        MEMORIES: "/dashboard/admin/anniversary/memories",
      },
    },
    MEMBERS: {
      EVENEMENTS: "/dashboard/members/evenements",
      REPETITIONS: "/dashboard/members/repetitions",
      TRAVAIL_ROOT: "/dashboard/members/travail",
    },
    PUBLIC: {
      PROCHAINS_CONCERTS: "/dashboard/public/concerts/prochains-concerts",
      ANNONCES: "/dashboard/public/annonces",
      REJOINDRE_FAQ: "/dashboard/public/rejoindre-faq",
      REGLAGES: "/dashboard/public/reglages-du-site",
      PROJETS: {
        ROOT: "/dashboard/public/concerts/projets",
      },
      GALLERY: {
        VIDEOS: "/dashboard/public/gallery/videos",
      },
    },
  },
  /**
   * « Mes ventes »: a seller's own buyers and payments, outside the
   * dashboard (a seller needs no admin role).
   */
  SELLER: {
    ROOT: "/ventes",
    SALE: (id: string) => `/ventes/${encodeURIComponent(id)}`,
  },
  ERROR: "/error",
  UNAUTHORIZED: "/unauthorized",
};

export default RouteNames;
