import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/splash-screen")({
  head: () => ({
    meta: [
      { title: "\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - Tasweqt Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - Tasweqt Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - Tasweqt Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - Tasweqt Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenSplashScreen,
});

function ScreenSplashScreen() {
  return (
    <ScreenFrame slug="splash-screen" title="\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - Tasweqt Betak" bodyClassName="bg-primary-container m-0 p-0 overflow-hidden font-body-md text-on-surface h-screen w-screen flex flex-col justify-center items-center">
      

<main className={"w-full max-w-md h-full mx-auto relative flex flex-col justify-center items-center p-lg"}>

<div className={"relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center splash-pulse"}>

<img alt={"Tasweqt Betak Logo"} className={"w-full h-full object-contain"} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBsDqfziQsw8iInh4HUm6z3519JyGikihu5MLGTDGEn5LYgCjiWkja8l42zTKIpIzg3MAMVsdSW3bm8IsuBJSrF9HN7nSMRM2oy2okoK1IHj-Db0y7cJ4bQufcbOINmcGOdf2edTIYh9dlcfyh8DRl0fmfA3eqOFr72USQ2dgSr-Z9CV_Xd1uOjwAaz0zEkUHV2hS5i5z3EUj4FWjPythh_o2CWThSj3Z3HcFnu1pSfMwYL_RjYQcJotpL-73C3_xzyhA"} />
</div>

<div className={"absolute bottom-16 left-0 right-0 flex justify-center"}>
<div className={"flex space-x-2 rtl:space-x-reverse"}>
<div className={"w-2 h-2 rounded-full bg-secondary animate-bounce"} style={{ animationDelay: "0s" }}></div>
<div className={"w-2 h-2 rounded-full bg-secondary animate-bounce"} style={{ animationDelay: "0.2s" }}></div>
<div className={"w-2 h-2 rounded-full bg-secondary animate-bounce"} style={{ animationDelay: "0.4s" }}></div>
</div>
</div>
</main>


    </ScreenFrame>
  );
}
