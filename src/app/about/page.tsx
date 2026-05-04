import { AboutPage } from "@/components/AboutPage";
import { getAssetTree } from "@/lib/assets";

export default async function About() {
  const tree = await getAssetTree();

  return <AboutPage tree={tree} />;
}
