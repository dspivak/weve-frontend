"use client";

import Link from "next/link";
import { MessageSquare, Users, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { HomeHero } from "./HomeHero";

export function LandingPage() {
    return (
        <div className="flex-1">
            <HomeHero />

            {/* How it Works Section */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16 px-4">
                        <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">How Weve Works</h2>
                        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                            Three simple steps to go from a spark of an idea to a community-powered reality.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                step: "01",
                                title: "Conceive with AI",
                                description: "Chat with our PF Engine to articulate your vision. Our AI helps you breakdown complex ideas into manageable tasks and structured narratives.",
                                icon: MessageSquare,
                                color: "text-blue-500",
                                bg: "bg-blue-500/10"
                            },
                            {
                                step: "02",
                                title: "Launch to the Feed",
                                description: "Publish your idea to the Weve community. Let others see your vision, save it to their collections, and reach out to collaborate.",
                                icon: Globe,
                                color: "text-purple-500",
                                bg: "bg-purple-500/10"
                            },
                            {
                                step: "03",
                                title: "Collaborate & Build",
                                description: "Gather contributions from experts and enthusiasts alike. Use integrated chat and task tracking to turn your co-created vision into reality.",
                                icon: Users,
                                color: "text-green-500",
                                bg: "bg-green-500/10"
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-md transition-shadow group">
                                <div className="absolute -top-4 -right-4 text-6xl font-black text-foreground/5 select-none transition-colors group-hover:text-primary/10">
                                    {item.step}
                                </div>
                                <div className={`size-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6`}>
                                    <item.icon className="size-7" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-16 md:py-24 overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        <div className="px-2">
                            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                                Powerful tools for <br className="hidden md:block" />
                                <span className="text-primary">Visionary Creators</span>
                            </h2>
                            <p className="text-muted-foreground mb-8 text-base md:text-lg">
                                We've built an ecosystem specifically designed to overcome the "blank page" problem and the difficulty of finding the right collaborators.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "PF Engine", desc: "Our proprietary AI agent trained on thousands of successful projects.", icon: Zap },
                                    { title: "Direct Contribution", desc: "Don't just talk — contribute funds or skills directly to specific milestones.", icon: Sparkles },
                                    { title: "Verified Community", desc: "Connect with real people verified through our reputation system.", icon: Shield },
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="size-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <f.icon className="size-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{f.title}</h4>
                                            <p className="text-muted-foreground text-sm">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                                <div className="w-4/5 h-4/5 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
                                    <div className="h-8 border-b border-border bg-muted/30 px-4 flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-red-400" />
                                        <div className="size-2 rounded-full bg-amber-400" />
                                        <div className="size-2 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
                                            <div className="h-3 w-[90%] bg-muted/60 rounded animate-pulse delay-75" />
                                            <div className="h-3 w-[95%] bg-muted/60 rounded animate-pulse delay-150" />
                                        </div>
                                        <div className="h-32 w-full bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center">
                                            <Sparkles className="size-8 text-primary opacity-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-6 -right-6 bg-background p-4 rounded-2xl border border-border shadow-xl animate-bounce duration-[3000ms]">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                        <Users className="size-4" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold">5 New Contributors</p>
                                        <p className="text-muted-foreground">Just joined your idea</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 px-4">
                <div className="mx-auto max-w-5xl rounded-3xl bg-primary px-6 md:px-8 py-12 md:py-16 text-center text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/40">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    <h2 className="text-2xl md:text-5xl font-bold mb-6 px-2 leading-tight">Ready to weave something great?</h2>
                    <p className="text-primary-foreground/80 text-base md:text-lg mb-8 md:text-lg mb-10 max-w-xl mx-auto px-4">
                        Join thousands of other creators who are using AI to build the future of collective action.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center px-8 md:px-10 py-3.5 md:py-4 bg-background text-foreground font-bold rounded-xl hover:bg-neutral-100 transition-all hover:scale-105"
                    >
                        Join Weve Today
                    </Link>
                </div>
            </section>
        </div>
    );
}
