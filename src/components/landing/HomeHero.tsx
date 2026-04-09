"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageSquare, Users, Sparkles } from "lucide-react";

export function HomeHero() {
    return (
        <div className="relative overflow-hidden bg-background pt-24 pb-16 md:pt-32 md:pb-40">
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Glows */}
                <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] animate-pulse duration-[10000ms]" />
                <div className="absolute top-[10%] -right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[100px] animate-pulse duration-[8000ms] delay-700" />
                <div className="absolute -bottom-[10%] left-[20%] w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse duration-[12000ms] delay-1000" />
                <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-primary/5 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8 animate-fade-in">
                        <Sparkles className="size-3" />
                        <span>AI-Powered Idea Incubator</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight px-4">
                        Bring Your Best Ideas to <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Life with AI</span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-base md:text-xl text-muted-foreground mb-10 leading-relaxed px-6">
                        Co-create, collaborate, and contribute. Weve combines advanced AI chat to help you articulate your vision with a community ready to help you build it.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            href="/signup"
                            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                        >
                            Start Creating
                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-background border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all active:scale-95"
                        >
                            Explore Ideas
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto py-12 md:py-20 border-t border-border/50 px-4">
                        <div className="flex flex-col gap-5 p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all hover:bg-secondary/50 group">
                            <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <MessageSquare className="size-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-3">AI Co-Creation</h3>
                                <p className="text-base text-muted-foreground leading-relaxed">Use our specialized PF AI chat to flesh out your thoughts into structured, actionable ideas.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-5 p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:border-purple-500/30 transition-all hover:bg-secondary/50 group">
                            <div className="size-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <Users className="size-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-3">Community Driven</h3>
                                <p className="text-base text-muted-foreground leading-relaxed">Share your visions with a network of creators. Get feedback, find partners, and grow together.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-5 p-8 rounded-3xl bg-secondary/30 border border-border/50 hover:border-green-500/30 transition-all hover:bg-secondary/50 group">
                            <div className="size-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                <Sparkles className="size-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-3">Direct Contribution</h3>
                                <p className="text-base text-muted-foreground leading-relaxed">Beyond just liking — contribute tasks, resources, and real value to help ideas become reality.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
