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
      CA: "/dashboard/admin/ca",
      DOCUMENTS: "/dashboard/admin/documents",
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
      EVENEMENTS: "/dashboard/members/evenements",
      REPETITIONS: "/dashboard/members/repetitions",
      TRAVAIL_ROOT: "/dashboard/members/travail",
    },
    PUBLIC: {
      PROCHAINS_CONCERTS: "/dashboard/public/concerts/prochains-concerts",
      PROJETS: {
        ROOT: "/dashboard/public/concerts/projets",
      },
      GALLERY: {
        VIDEOS: "/dashboard/public/gallery/videos",
      },
    },
  },
  ERROR: "/error",
  UNAUTHORIZED: "/unauthorized",
};

export default RouteNames;
