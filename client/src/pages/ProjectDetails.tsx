import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProjectById, type Project } from "../api/projects";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          </section>
        ) : null}
      </div>
    </main>
  );
}
