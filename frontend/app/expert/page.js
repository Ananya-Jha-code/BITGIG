import { redirect } from "next/navigation";

// /expert has no screen of its own; experts land on the marketplace.
export default function ExpertIndex() {
  redirect("/tasks");
}
