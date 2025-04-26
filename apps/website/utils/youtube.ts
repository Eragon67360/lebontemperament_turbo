export const extractYouTubeId = (url: string): string => {
  if (!url) return "";

  // Handle youtu.be URLs
  if (url.includes("youtu.be")) {
    return url.split("youtu.be/")[1]?.split("?")[0] || "";
  }

  // Handle youtube.com/shorts URLs
  if (url.includes("/shorts/")) {
    return url.split("/shorts/")[1]?.split("?")[0] || "";
  }

  // Handle standard youtube.com URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2]?.length === 11 ? match[2] : "";
};
