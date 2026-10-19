import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getProjectById, type Project } from "../api/projects";
import { getProjectTasks, type Task } from "../api/tasks";

function getPriorityStyle(priority: string) {
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

function getDeadlineStyle(deadline: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(deadline);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate.getTime() < today.getTime()) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  if (dueDate.getTime() === today.getTime()) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  return "border-blue-400/30 bg-blue-400/10 text-blue-300";
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProject() {
      if (!id || !/^\d+$/.test(id)) {
        setError("Invalid project ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getProjectById(Number(id));
        if (active) setProject(data);
      } catch (err) {
        console.error("Failed to load project:", err);
        if (active) setError("Couldn't load this project.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProject();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      if (!id || !/^\d+$/.test(id)) {
        setTasksError("Invalid project ID.");
        setTasksLoading(false);
        return;
      }

      setTasksLoading(true);
      setTasksError("");

      try {
        const data = await getProjectTasks(Number(id));

        if (active) {
          setTasks(data);
        }
      } catch (err) {
        console.error("Failed to load project tasks:", err);

        if (active) {
          setTasksError("Couldn't load project tasks.");
        }
      } finally {
        if (active) {
          setTasksLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-[#111412] p-6 text-white sm:p-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard"
          className="text-sm text-[#C5F36B] hover:underline"
        >
          ← Back to dashboard
        </Link>

        {loading ? (
          <p className="mt-8 text-white/60">Loading project...</p>
        ) : error ? (
          <p className="mt-8 text-red-400">{error}</p>
        ) : project ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#171A18] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C5F36B]">
              Project workspace
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              {project.name}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/60">
              {project.description || "No description added yet."}
            </p>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="text-lg font-medium">Project members</h2>

              <div className="mt-4 space-y-3">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 p-4"
                  >
                    <span className="text-sm">
                      {member.user.username}
                    </span>

                    <span className="rounded-full border border-[#C5F36B]/20 bg-[#C5F36B]/10 px-3 py-1 text-xs text-[#C5F36B]">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium">Project tasks</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Tasks and their current progress.
                  </p>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                  {tasks.length} tasks
                </span>
              </div>

              {tasksLoading ? (
                <p className="mt-5 text-sm text-white/60">
                  Loading tasks...
                </p>
              ) : tasksError ? (
                <p className="mt-5 text-sm text-red-400">
                  {tasksError}
                </p>
              ) : tasks.length === 0 ? (
                <div className="mt-5 rounded-xl border border-white/10 p-5">
                  <p className="font-medium">No tasks yet</p>
                  <p className="mt-2 text-sm text-white/50">
                    Tasks created for this project will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {tasks.map((task) => (
                    <article
                      key={task.id}
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/projects/${project.id}/tasks/${task.id}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/projects/${project.id}/tasks/${task.id}`);
                        }
                      }}
                      className="rounded-xl border border-white/10 p-4 transition cursor-pointer hover:border-[#C5F36B]/40 focus-visible:outline-2 focus-visible:outline-[#C5F36B] sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <h3 className="font-medium">{task.title}</h3>

                          <p className="mt-2 text-sm leading-6 text-white/60">
                            {task.description || "No description added."}
                          </p>
                        </div>

                        <span className="w-fit rounded-full border border-[#C5F36B]/20 bg-[#C5F36B]/10 px-3 py-1 text-xs text-[#C5F36B]">
                          {task.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 font-medium ${getPriorityStyle(task.priority)}`}>
                          Priority: {task.priority}
                        </span>

                        {task.deadline && (
                          <span className={`rounded-full border px-3 py-1 font-medium ${getDeadlineStyle(task.deadline)}`}>
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-3">
                        <p className="text-xs text-white/50">
                          Assigned to
                        </p>

                        <p className="mt-1 text-sm text-white/80">
                          {task.assignees.length > 0
                            ? task.assignees
                                .map((assignee) => assignee.user.username)
                                .join(", ")
                            : "Unassigned"}
                        </p>

                        <p className="mt-2 text-xs text-white/40">
                          Created by {task.createdBy.username}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
