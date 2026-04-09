"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Post, PostAuthor } from "./PostCard";
import { getAccessToken, listMyPosts, createPost } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Avatar } from "@/components/ui/avatar";

type CollaborationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    parentPost: Post;
    onSuccess: () => void;
};

export function CollaborationModal({
    isOpen,
    onClose,
    parentPost,
    onSuccess,
}: CollaborationModalProps) {
    const [step, setStep] = useState(1);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const parseTasksFromContent = (content: string): string[] => {
        const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
        const tasks: string[] = [];
        let capturing = false;
        for (const line of lines) {
            // Check for "Key tasks:" or similar markers
            if (/key tasks/i.test(line)) {
                capturing = true;
                continue;
            }
            if (capturing) {
                // Look for numbered (1. ) or bulleted (*) tasks
                const match = /^(\d+\.|\*|-)\s+(.+)$/.exec(line);
                if (match) {
                    tasks.push(match[2]);
                } else if (tasks.length > 0) {
                    // Stop if we hit a line that doesn't look like a task after we've started collecting
                    break;
                }
            }
        }
        return tasks;
    };

    const availableTasks = parseTasksFromContent(parentPost.content);

    const handleNext = () => {
        if (selectedTask) setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        const token = getAccessToken();
        if (!token || !selectedTask) return;

        setSubmitting(true);
        try {
            await createPost(token, {
                title: `Collaboration on ${selectedTask}`,
                content: `Task: ${selectedTask}\n\nContribution: ${comment.trim() || "I'm collaborating on this task!"}`,
                status: "published",
                collaboration_parent_id: parentPost.id,
                // collaboration_task_id is currently UUID but tasks are text. 
                // We'll leave it null for now as we're linking to the parent post.
                collaboration_task_id: null,
            });
            toast("Collaboration submitted!");
            onSuccess();
            onClose();
            // Reset state
            setStep(1);
            setSelectedTask(null);
            setComment("");
        } catch (e) {
            toast("Failed to submit collaboration", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <header className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full"
                                onClick={handleBack}
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        )}
                        <h2 className="text-lg font-bold text-foreground">
                            {step === 1 ? "Select Key Task" : "Add Collaboration Comment"}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full"
                        onClick={onClose}
                    >
                        <X className="size-5" />
                    </Button>
                </header>

                <div className="p-4">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Select one of the key tasks from this post to share your contribution.
                            </p>
                            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {availableTasks.length > 0 ? (
                                    availableTasks.map((task, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedTask(task)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTask === task
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border bg-muted/30 hover:bg-muted/60"
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-sm font-medium text-foreground leading-relaxed">{task}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-sm text-muted-foreground">This post doesn't have any specific tasks listed.</p>
                                        <p className="text-xs text-muted-foreground mt-1 px-4">You can still collaborate on the project in general.</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => {
                                                setSelectedTask("General Project Collaboration");
                                                setStep(2);
                                            }}
                                        >
                                            Collaborate Generally
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {availableTasks.length > 0 && (
                                <Button
                                    className="w-full mt-4 bg-primary text-primary-foreground py-6 text-base font-bold"
                                    disabled={!selectedTask}
                                    onClick={handleNext}
                                >
                                    Continue
                                    <ChevronRight className="ml-2 size-4" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-muted/50 p-4 border border-border">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Selected Task</span>
                                <p className="font-bold text-foreground mt-1 text-sm leading-relaxed">
                                    {selectedTask}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Your contribution comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Explain how you will help with this task..."
                                    className="w-full min-h-[160px] rounded-xl bg-muted/50 border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                                    autoFocus
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="w-full bg-primary text-primary-foreground py-7 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform"
                                    disabled={submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? <Loader2 className="size-6 animate-spin mr-2" /> : "Submit Collaboration"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
