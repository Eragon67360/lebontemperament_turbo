export const extractYouTubeId = (url: string): string => {
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    const normalizedUrl = url.trim();

    if (
      !normalizedUrl.includes("youtube") &&
      !normalizedUrl.includes("youtu.be")
    ) {
      return "";
    }

    let videoId = "";

    if (normalizedUrl.includes("youtu.be/")) {
      videoId = normalizedUrl.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
    } else if (normalizedUrl.includes("/shorts/")) {
      videoId = normalizedUrl.split("/shorts/")[1]?.split(/[?#]/)[0] || "";
    } else {
      // Prefer the v= query param wherever it sits (watch?v=..., watch?feature=share&v=...)
      const paramMatch = normalizedUrl.match(/[?&]v=([^#&]*)/);
      if (paramMatch?.[1]) {
        videoId = paramMatch[1];
      } else {
        const regExp =
          /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = normalizedUrl.match(regExp);
        videoId = match?.[7] || "";
      }
    }

    return videoId.length === 11 ? videoId : "";
  } catch (error) {
    console.error("Error extracting YouTube ID:", error);
    return "";
  }
};
