export const setColumns = (width: number): number => {
  if (width < 768) {
    return 2;
  } else if (width < 1200) {
    return 3;
  } else {
    return 4;
  }
};
