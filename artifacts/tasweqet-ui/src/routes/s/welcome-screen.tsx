import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/welcome-screen")({
  head: () => ({
    meta: [
      { title: "Tasweeqet Betak - Welcome | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Welcome \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Tasweeqet Betak - Welcome | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Welcome \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenWelcomeScreen,
});

function ScreenWelcomeScreen() {
  return (
    <ScreenFrame slug="welcome-screen" title="Tasweeqet Betak - Welcome" bodyClassName="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-hidden">
      


<main className={"flex-1 flex flex-col w-full max-w-md mx-auto relative z-10 min-h-[100dvh]"}>

<div className={"relative w-full h-[55vh] rounded-b-[2rem] overflow-hidden shadow-[0_4px_32px_rgba(94,60,26,0.08)] bg-surface-container"}>
<div className={"absolute inset-0 bg-cover bg-center"} data-alt={"A vibrant, high-quality lifestyle photograph featuring a cheerful local delivery scene in an optimistic light-mode aesthetic. The image showcases fresh groceries and warm coffee being delivered to a welcoming home environment. The scene uses bright, inviting lighting with dominant yellow and warm brown tones, emphasizing a sense of community, speed, and reliability. High contrast and clean composition."} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCmbNOvFIWPELBNMZ6ZYZZoujoLUL1Ulj2bLZXKom4vNvyHUC1a_DUWzSc1XbXZPrnCQmwfV_LC9COQtaVuqbZDav7ZtgK_EvvllnE24gsOwgqEPgqjDnl9qhKqW0qp1vbK7uO0Wngrlnx6feCmPviKz3u3--_IkZIHwutn5tRxwVRHgMZJAKr4RzcOlioT6JGXxkjnzfdBx2trOjPfoI9Jb7cnc3BPyKVJhC-rm2oRZVl6YlAh0r5y')" }}>
</div>

<div className={"absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent"}></div>

<div className={"absolute top-8 left-0 right-0 flex justify-center"}>

</div>
</div>

<div className={"flex-1 flex flex-col justify-end px-margin-mobile pb-margin-mobile pt-lg relative z-20 bg-surface"}>

<div className={"text-center mb-xl"}>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-sm"}>
                    كل اللي محتاجه... لحد باب بيتك
                </h1>
<p className={"font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto"}>
                    اطلب أكلك، قهوتك، احتياجاتك اليومية ومنتجاتك الصحية من الأماكن اللي بتحبها.
                </p>
</div>

<div className={"flex flex-col gap-sm w-full"}>
<button className={"w-full bg-primary-container text-on-primary-container font-headline-md text-headline-md py-4 rounded-[12px] flex justify-center items-center gap-2 hover:brightness-95 transition-all active:scale-[0.98]"}>
                    إنشاء حساب
                </button>
<button className={"w-full bg-surface border-2 border-primary-container text-on-primary-container font-headline-md text-headline-md py-4 rounded-[12px] flex justify-center items-center gap-2 hover:bg-surface-container-low transition-all active:scale-[0.98]"}>
                    تسجيل الدخول
                </button>
<button className={"mt-xs text-on-surface-variant font-label-lg text-label-lg py-2 hover:text-primary transition-colors"}>
                    تصفح كضيف
                </button>
</div>
</div>
</main>

    </ScreenFrame>
  );
}
