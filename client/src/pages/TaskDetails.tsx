import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTaskById, type Task } from "../api/tasks";

function getPriorityStyle(priority: Task["priority"]) {
  switch (priority) {
    case "LOW":
      return "border-green-400/30 bg-green-400/10 text-green-300";
    case "MEDIUM":
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    case "HIGH":
      return "border-orange-400/30 bg-orange-400/10 text-orange-300";
    case "URGENT":
      return "border-red-500/30 bg-red-500/10 text-red-500";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function getStatusStyle(status: Task["status"]) {
  switch (status) {
    case "TODO":
      return "border-slate-400/30 bg-slate-400/10 text-slate-300";
    case "IN_PROGRESS":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    case "REVIEW":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "DONE":
      return "border-green-400/30 bg-green-400/10 text-green-300";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export default function TaskDetails() {
  const { projectId, taskId } = useParams<{
    projectId: string;
    taskId: string;
  }>();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTask() {
      if (
        !projectId ||
        !taskId ||
        !/^\d+$/.test(projectId) ||
        !/^\d+$/.test(taskId)
      ) {
        setError("Invalid project or task ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getTaskById(
          Number(projectId),
          Number(taskId)
        );

        if (active) {
          setTask(data);
        }
      } catch (err) {
        console.error("Failed to load task:", err);

        if (active) {
          setError("Couldn't load this task.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTask();

    return () => {
      active = false;
    };
  }, [projectId, taskId]);

  return (
    <main className="min-h-screen bg-[#111412] p-6 text-white sm:p-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to={projectId ? `/projects/${projectId}` : "/projects"}
          className="text-sm text-[#C5F36B] hover:underline"
        >
          ← Back to project
        </Link>

        {loading ? (
          <p className="mt-8 text-white/60">Loading task...</p>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
            <p className="text-red-300">{error}</p>
            <Link
              to={projectId ? `/projects/${projectId}` : "/projects"}
              className="mt-4 inline-block text-sm text-[#C5F36B] hover:underline"
            >
              Return to project
            </Link>
          </div>
        ) : task ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#171A18] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C5F36B]">
              Task details
            </p>

            <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <h1 className="wrap-break-word text-3xl font-semibold">
                  {task.title}
                </h1>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">
                  {task.description || "No description added."}
                </p>
              </div>

              <span
                className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(task.status)}`}
              >
                {task.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span
                className={`rounded-full border px-3 py-1 font-medium ${getPriorityStyle(task.priority)}`}
              >
                Priority: {task.priority}
              </span>

              {task.deadline && (
                <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 font-medium text-blue-300">
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">
              <div>
                <h2 className="text-sm font-medium text-white/60">
                  Assigned to
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {task.assignees.length > 0 ? (
                    task.assignees.map((assignee) => (
                      <span
                        key={assignee.id}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        {assignee.user.username}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-white/40">Unassigned</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-white/60">
                  Created by
                </h2>

                <p className="mt-3 text-sm">
                  {task.createdBy.username}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="text-sm font-medium text-white/60">
                Task information
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Task ID</p>
                  <p className="mt-1 text-sm">#{task.id}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Last updated</p>
                  <p className="mt-1 text-sm">
                    {new Date(task.updatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs text-white/40">Created on</p>
                  <p className="mt-1 text-sm">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
