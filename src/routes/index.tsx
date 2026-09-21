import { createFileRoute } from "@tanstack/react-router";
import { Presentation } from "@/components/estate/presentation";
import { SmoothScroll } from "@/components/estate/smooth-scroll";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <SmoothScroll>
      <Presentation />
    </SmoothScroll>
  );
}
