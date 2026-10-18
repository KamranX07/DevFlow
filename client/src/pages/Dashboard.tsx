import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/useAuth";
import { getMyProjects, type Project } from "../api/projects";
import { getProjectOverview } from "../api/analytics";
import { getProjectActivity, type ProjectActivity } from "../api/activity";
import { getProjectTasks, type Task } from "../api/tasks";
import { useNavigate } from "react-router-dom";

const navigation = [
  { label: "Overview", icon: "◫" },
  { label: "My projects", icon: "▦" },
  { label: "My tasks", icon: "✓" },
  { label: "Activity", icon: "↗" },
];

const stats = [
  { label: "Active projects", value: "—", detail: "Your workspace", icon: "▦" },
  { label: "Open tasks", value: "—", detail: "Across your projects", icon: "◷" },
  { label: "Completed", value: "—", detail: "Tasks finished", icon: "✓" },
];

function formatActivityAction(action: string): string {
  const descriptions: Record<string, string> = {
    COMMENT_CREATED: "added a comment to",
    COMMENT_UPDATED: "updated the comment in",
    COMMENT_DELETED: "deleted a comment from",
    TASK_ASSIGNEES_CHANGED: "updated the assignees for",
    TASK_CREATED: "created a task",
    TASK_UPDATED: "updated the task",
    TASK_STATUS_CHANGED: "changed the status of",
    TASK_DELETED: "deleted the task",
    MEMBER_ADDED: "added a member to",
    MEMBER_REMOVED: "removed a member from",
    ATTACHMENT_UPLOADED: "uploaded an attachment in",
    ATTACHMENT_DELETED: "deleted an attachment from",
  };

  return descriptions[action.toUpperCase()] ??
    action.replaceAll("_", " ").toLowerCase();
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState("Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [retryCount, setRetryCount] =useState(0);
  const [openTasks, setOpenTasks] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(false);
  const [activityRetry, setActivityRetry] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [taskRetryCount, setTaskRetryCount] = useState(0);

  // Load Projects
  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setProjectsLoading(true);
      setProjectsError("");

      try {
        const data = await getMyProjects();

        if (active) {
          setProjects(data);
        }
      } catch {
        if (active) {
          setProjectsError("Couldn't load your projects. Please try again.");
        }
      } finally {
        if (active) {
          setProjectsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [retryCount]);

  // Load Tasks Analytics
  useEffect(() => {
    let active = true;

    async function loadTaskStats() {
      if (projectsLoading) return;

      if (projects.length === 0) {
        setOpenTasks(0);
        setCompletedTasks(0);
        return;
      }

      setAnalyticsLoading(true);

      try {
        const overviews = await Promise.all(
          projects.map((project) => getProjectOverview(project.id))
        );

        const open = overviews.reduce(
          (total, item) =>
            total +
            item.statusBreakdown.TODO +
            item.statusBreakdown.IN_PROGRESS +
            item.statusBreakdown.REVIEW,
          0
        );

        const completed = overviews.reduce(
          (total, item) => total + item.overview.completedTasks,
          0
        );

        if (active) {
          setOpenTasks(open);
          setCompletedTasks(completed);
        }
      } catch (error) {
        console.error("Failed to load task statistics:", error);

        if (active) {
          setOpenTasks(null);
          setCompletedTasks(null);
        }
      } finally {
        if (active) setAnalyticsLoading(false);
      }
    }

    void loadTaskStats();

    return () => {
      active = false;
    };
  }, [projects, projectsLoading]);

  // Load Recent Activities
  useEffect(() => {
    let active = true;

    async function loadRecentActivity() {
      if (projectsLoading) return;

      if (projects.length === 0) {
        setActivities([]);
        setActivityError(false);
        return;
      }

      setActivityLoading(true);
      setActivityError(false);

      try {
        const results = await Promise.all(
          projects.map((project) => getProjectActivity(project.id))
        );

        const recent = results
          .flat()
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        if (active) setActivities(recent);
      } catch (error) {
        console.error("Failed to load recent activity:", error);

        if (active) {
          setActivities([]);
          setActivityError(true);
        }
      } finally {
        if (active) setActivityLoading(false);
      }
    }

    void loadRecentActivity();

    return () => {
      active = false;
    };
  }, [projects, projectsLoading, activityRetry]);

  // Load Tasks
  useEffect(() => {
    let active = true;

    async function loadTasks() {
      setTasksLoading(true);
      setTasksError("");

      try {
        const results = await Promise.all(
          projects.map((project) => getProjectTasks(project.id)),
        );

        if (active) {
          setTasks(results.flat());
        }
      } catch (error) {
        console.error("Failed to load dashboard tasks:", error);

        if (active) {
          setTasksError("Couldn't load your tasks. Please try again");
        }
      } finally {
        if (active) {
          setTasksLoading(false);
        }
      }
    }

    if (projectsLoading) return;

    void loadTasks();

    return () => {
      active = false;
    };
  }, [projects, projectsLoading, taskRetryCount]);

  const taskStats = [
    {
      label: "To Do",
      status: "TODO",
      count: tasks.filter((task) => task.status === "TODO").length,
    },
    {
      label: "In Progress",
      status: "IN_PROGRESS",
      count: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    },
    {
      label: "In Review",
      status: "REVIEW",
      count: tasks.filter((task) => task.status === "REVIEW").length,
    },
    {
      label: "Completed",
      status: "DONE",
      count: tasks.filter((task) => task.status === "DONE").length,
    },
  ]

  const dashboardStats = stats.map((stat, index) => {
    if (index === 0) {
      return { ...stat, value: String(projects.length) };
    }

    if (index === 1) {
      return {
        ...stat,
        value: analyticsLoading
          ? "..."
          : openTasks === null
            ? "—"
            : String(openTasks),
      };
    }

    return {
      ...stat,
      value: analyticsLoading
        ? "..."
        : completedTasks === null
          ? "—"
          : String(completedTasks), 
    };
  });

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#111412] text-[#F0F2EB]">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* NAVIGATION MENU */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/8 bg-[#171A18] p-5 transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <a href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5F36B] text-xl font-black text-[#111412]">
            D
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">
              DevFlow<span className="text-[#C5F36B]">.</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#8B948B]">
              Developer workspace
            </span>
          </span>
        </a>

        <div className="mt-10">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#727B73]">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  setMobileMenuOpen(false);

                  if (item.label === "Overview") {
                    navigate("/dashboard");
                  } else if (item.label === "My projects") {
                    navigate("/projects");
                  } else if (item.label === "My tasks") {
                    navigate("/tasks");
                  } else if (item.label === "Activity") {
                    navigate("/activity");
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  activeNav === item.label
                    ? "bg-[#C5F36B]/10 font-semibold text-[#C5F36B]"
                    : "text-[#A5ADA4] hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
                {activeNav === item.label && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C5F36B]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-white/8 bg-white/2.5 p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#292F29] font-bold text-[#C5F36B]">
            {user?.username?.charAt(0).toUpperCase() ?? "D"}
          </div>
          <p className="truncate text-sm font-semibold">
            {user?.username ?? "DevFlow user"}
          </p>
          <p className="mt-1 text-xs text-[#8B948B]">Your account</p>
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-[#B8C0B6] transition hover:border-[#C5F36B]/40 hover:text-[#C5F36B]"
          >
            Sign out ↗
          </button>
        </div>
      </aside>

      <div className="min-w-0 md:pl-64">

        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-white/8 bg-[#111412]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            {/* MOBILE NAVIGATION MENU */}
            <button
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-white/10 px-3 py-2 text-[#C5F36B] md:hidden"
            >
              ☰
            </button>
            <div>
              <p className="text-xs text-[#8B948B]">Workspace / Overview</p>
              <p className="mt-0.5 text-sm font-semibold">Your command center</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-[#A5ADA4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C5F36B]" />
              Workspace ready
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C5F36B]/30 bg-[#C5F36B]/10 text-sm font-bold text-[#C5F36B]">
              {user?.username?.charAt(0).toUpperCase() ?? "D"}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
          <section className="relative overflow-hidden rounded-3xl border border-white/9 bg-[#191E19] p-6 sm:p-9 lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#C5F36B]/10 sm:h-80 sm:w-80"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-14 h-48 w-48 rounded-full border border-[#C5F36B]/10 sm:h-64 sm:w-64"
            />

            <div className="relative max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5F36B]">
                Your work, in motion
              </p>
              <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Make room for
                <br />
                <span className="text-[#C5F36B]">great work.</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#A5ADA4] sm:text-base sm:leading-7">
                Welcome back, {user?.username ?? "developer"}. Your projects,
                tasks, and team progress will come together here.
              </p>

              <button
                onClick={() => setActiveNav("My projects")}
                className="mt-7 inline-flex items-center gap-3 rounded-xl bg-[#C5F36B] px-5 py-3 text-sm font-bold text-[#111412] transition hover:bg-[#D5FF83] focus:outline-none focus:ring-2 focus:ring-[#C5F36B] focus:ring-offset-2 focus:ring-offset-[#191E19]"
              >
                Explore workspace <span className="text-lg">↗</span>
              </button>
            </div>

            <div className="pointer-events-none absolute bottom-7 right-8 hidden select-none font-mono text-[10px] leading-5 text-[#697467] lg:block">
              <p>DEVFLOW / WORKSPACE</p>
              <p>BUILD · TRACK · SHIP</p>
              <p className="text-[#C5F36B]/60">SYS.READY_</p>
            </div>
          </section>

          {/* DASHBOARD STATS */}
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8B948B]">
                  At a glance
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Workspace overview
                </h2>
              </div>
              <span className="pb-1 text-xs text-[#727B73]">Live data coming next</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {dashboardStats.map((stat, index) => (
                <article
                  key={stat.label}
                  className="group rounded-2xl border border-white/8 bg-[#171A18] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#C5F36B]/30 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A5ADA4]">{stat.label}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/2.5 text-lg text-[#C5F36B]">
                      {stat.icon}
                    </span>
                  </div>
                  <p className="mt-6 text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        index === 0 ? "bg-[#C5F36B]" : "bg-[#626B61]"
                      }`}
                    />
                    <span className="text-xs text-[#7F887E]">{stat.detail}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
          {/* PROJECTS */}
            <article className="min-2-0 rounded-2xl border border-white/8 bg-[#171A18] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B948B]">
                    Project space
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">Your projects</h2>
                </div>
                <span className="shrink-0 text-xs text-[#727B73]">PROJECTS / {String(projects.length).padStart(2, "0")}</span>
              </div>

              {projectsLoading ? (
                <div role="status" className="mt-6 rounded-xl border border-white/10 p-6 text-sm text-[#A5ADA4]">
                  Loading your projects...
                </div>
              ) : projectsError ? (
                <div role="alert" className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="text-sm text-red-300">{projectsError}</p>
                  <button
                    onClick={() => setRetryCount((count) => count + 1)}
                    className="mt-3 rounded-lg bg-[#C5F36B] px-4 py-2 text-sm font-semibold text-[#111412] hover:bg-[#D5FF83]"
                  >
                    Try again
                  </button>
                </div>
              ) : projects.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center sm:py-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C5F36B]/20 bg-[#C5F36B]/[0.07] text-xl text-[#C5F36B]">
                    +
                  </div>
                  <p className="mt-4 text-sm font-medium">Your workspace starts here</p>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8B948B]">
                    Your projects will appear here when you create one or join a project.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {projects.map((project) => {
                    const currentMembership = project.members.find(
                      (member) => member.user.id === user?.id
                    );

                    return (
                      <div
                        key={project.id}
                        className="min-w-0 rounded-xl border border-white/8 bg-white/2 p-4 transition hover: border-[#C5F36B]/30 sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="wrap-break-word font-semibold text-[#F0F2EB]">
                              {project.name}
                            </h3>
                            <p className="mt-2 wrap-break-word text-xs leading-5 text-[#8B948B]">
                              {project.description || "No description added yet."}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full border border-[#C5F36B]/20 bg-[#C5F36B]/8 px-2.5 py-1 text-[10px] font-semibold text-[#C5F36B]">
                            {currentMembership?.role ?? "PROJECT MEMBER"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-xs text-[#8B948B]">
                          <span>
                            {project.members.length}{" "}
                            {project.members.length == 1 ? "member" : "members"}
                          </span>
                          <span className="max-w-full wrap-break-word">
                            Owner . {project.owner.username}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

          {/* ACTIVITY */}
            <article className="rounded-2xl border border-white/8 bg-[#171A18] p-5 sm:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B948B]">
                The activity stream
              </p>
              <h2 className="mt-2 text-lg font-semibold">Recent activity</h2>

              <div className="mt-6 flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="h-8 w-8 rounded-xl border border-[#C5F36B]/20 bg-[#C5F36B]/[0.07] text-center text-sm leading-8 text-[#C5F36B]">
                    ↗
                  </span>
                  <span className="mt-2 min-h-10 w-px flex-1 bg-white/10" />
                </div>
                <div className="pb-6">
                  {activityLoading ? (
                    <p className="text-sm text-white/50">
                      Loading recent activity...
                    </p>
                  ) : activityError ? (
                    <div className="space-y-3">
                      <p className="text-sm text-white/60">
                        Couldn't load recent activity.
                      </p>
                      <button
                        onClick={() => setActivityRetry((count) => count + 1)}
                        className="text-sm text-[#C5F36B] hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-white/50">
                      No recent activity yet. Updates will appear here as your team works.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div
                          key={`${activity.projectId}-${activity.id}`}
                          className="flex gap-3 border-b border-white/10 pb-4 last:border-0"
                        >
                          <div className="flex h-9 2-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-[#C5F36B]">
                            {activity.user.username.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white/85">
                              <span className="font-medium text-white">
                                {activity.user.username}
                              </span>{" "}
                              {formatActivityAction(activity.action)}
                              {activity.task && (
                                <>
                                  {" "}·{" "}
                                  <span className="text-white/70">
                                    {activity.task.title}
                                  </span>
                                </>
                              )}
                            </p>

                            <p className="mt-1 text-xs text-white/40">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}                  
                </div>
              </div>
            </article>
          </section>

          {/* FOOTER */}
          <footer className="mt-10 flex flex-col gap-2 border-t border-white/8 py-5 text-xs text-[#727B73] sm:flex-row sm:items-center sm:justify-between">
            <span>DevFlow — built for people who build.</span>
            <span className="font-mono">WORKSPACE / V1.0</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
