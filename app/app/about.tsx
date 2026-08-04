import { StaticContentScreen } from "@/src/components/StaticContentScreen";
import { CONTENT_PAGES } from "@/src/data/contentPages";

export default function AboutPage() {
  return <StaticContentScreen page={CONTENT_PAGES.about} />;
}
