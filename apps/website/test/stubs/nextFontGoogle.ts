// `next/font/google` only exists inside Next's compiler. Every font the app
// declares answers with empty class names, which is all a markup test needs.
const font = () => ({ className: "", variable: "", style: { fontFamily: "" } });

export const Bodoni_Moda = font;
export const EB_Garamond = font;
export const Gabarito = font;
export const Hanken_Grotesk = font;
export const Roboto = font;
