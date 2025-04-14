// utils/youtube.ts
export const extractYouTubeId = (url: string): string => {
  // Input validation
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    const normalizedUrl = url.trim();

    // Early return if URL doesn't contain youtube or youtu.be
    if (
      !normalizedUrl.includes("youtube") &&
      !normalizedUrl.includes("youtu.be")
    ) {
      return "";
    }

    // Handle different YouTube URL formats
    let videoId = "";

    // 1. youtu.be format
    if (normalizedUrl.includes("youtu.be/")) {
      videoId = normalizedUrl.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
    }
    // 2. YouTube shorts format
    else if (normalizedUrl.includes("/shorts/")) {
      videoId = normalizedUrl.split("/shorts/")[1]?.split(/[?#]/)[0] || "";
    }
    // 3. Standard youtube.com formats
    else {
      const regExp =
        /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = normalizedUrl.match(regExp);
      videoId = match?.[7] || "";
    }

    if (videoId && videoId.length === 11) {
      console.log(videoId);

      return videoId;
    }

    return "";
  } catch (error) {
    console.error("Error extracting YouTube ID:", error);
    return "";
  }
};
