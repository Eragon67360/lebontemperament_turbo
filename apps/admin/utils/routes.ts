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
      CA: "/dashboard/admin/ca",
      GOOGLE_GROUPS: "/dashboard/admin/google-groups",
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
      ROOT: "/dashboard/members",
      EVENEMENTS: "/dashboard/members/evenements",
      REPETITIONS: "/dashboard/members/repetitions",
      TRAVAIL_ROOT: "/dashboard/members/travail",
      TRAVAIL: (programId: string, groupSlug: string) =>
        `/dashboard/members/travail/${programId}/${groupSlug}`,
    },
    PUBLIC: {
      ROOT: "/dashboard/public",
      CONCERTS: "/dashboard/public/concerts",
      PROCHAINS_CONCERTS: "/dashboard/public/concerts/prochains-concerts",
      PROJETS: {
        ROOT: "/dashboard/public/concerts/projets",
        CREATE: "/dashboard/public/concerts/projets/create",
        PROJET: (projectId: string) =>
          `/dashboard/public/concerts/projets/${projectId}`,
      },
      HOME: {
        ROOT: "/dashboard/public/home",
        CDS: "/dashboard/public/home/cds",
        ABOUT: "/dashboard/public/home/about",
      },
      GALLERY: {
        ROOT: "/dashboard/public/gallery",
        IMAGES: "/dashboard/public/gallery/photos",
        VIDEOS: "/dashboard/public/gallery/videos",
      },
    },
  },
  ERROR: "/error",
  UNAUTHORIZED: "/unauthorized",
};

export default RouteNames;
