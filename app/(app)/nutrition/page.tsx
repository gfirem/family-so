import { redirect } from "next/navigation";

// "Comida" is now a section; its landing page is the recipe bank.
export default function NutritionPage() {
  redirect("/nutrition/recipes");
}
