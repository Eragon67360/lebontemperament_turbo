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
    },
    MEMBERS: {
      EVENEMENTS: "/dashboard/members/evenements",
      TRAVAIL: (programId: string, groupSlug: string) =>
        `/dashboard/members/travail/${programId}/${groupSlug}`,
    },
    PUBLIC: {
      ROOT: "/dashboard/public",
      CONCERTS: "/dashboard/public/concerts",
      PROCHAINS_CONCERTS: "/dashboard/public/concerts/prochains-concerts",
      PROJETS: {
        ROOT: "/dashboard/public/projets",
        CREATE: "/dashboard/public/projets/create",
        PROJET: (projectId: string) => `/dashboard/public/projets/${projectId}`,
      },
      HOME: {
        ROOT: "/dashboard/public/home",
        CDS: "/dashboard/public/home/cds",
        ABOUT: "/dashboard/public/home/about",
      },
      GALLERY: {
        ROOT: "/dashboard/public/gallery/",
        IMAGES: "/dashboard/public/gallery/photos",
        VIDEOS: "/dashboard/public/gallery/videos",
      },
    },
  },
  ERROR: "/error",
  UNAUTHORIZED: "/unauthorized",
};

export default RouteNames;
