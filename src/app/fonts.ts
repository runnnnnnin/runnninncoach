import { Geist, Geist_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Titres : grotesque grasse, serrée (style suisse, proche de l'Helvetica des stories).
const display = Inter_Tight({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700"] });
// Seulement pour le « R » du logo.
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["italic"] });

export const fontVars = `${geistSans.variable} ${geistMono.variable} ${display.variable} ${serif.variable}`;
