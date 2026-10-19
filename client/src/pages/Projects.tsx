import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProjects, type Project } from "../api/projects";

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const data = await getMyProjects();
        if (active) setProjects(data);
      } catch {
        if (active) {
          setError("Couldn't load projects. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#111412] p-6 text-white sm:p-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 text-sm text-[#C5F36B] hover:underline"
        >
          ← Back to dashboard
        </button>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#C5F36B]">
          Workspace
        </p>

        <h1 className="text-3xl font-bold">My projects</h1>
        <p className="mt-2 text-sm text-[#A5ADA4]">
          All projects you belong to, in one place.
        </p>

        {loading ? (
          <p className="mt-8 text-[#A5ADA4]">Loading projects...</p>
        ) : error ? (
          <p className="mt-8 text-red-400">{error}</p>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 p-8">
            <h2 className="text-lg font-semibold">No projects yet</h2>
            <p className="mt-2 text-sm text-[#A5ADA4]">
              Projects you join will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="rounded-2xl cursor-pointer border border-white/10 bg-[#171A18] p-6 text-left transition hover:border-[#C5F36B]/50"
              >
                <h2 className="text-lg font-semibold">{project.name}</h2>

                <p className="mt-2 text-sm text-[#A5ADA4]">
                  {project.description || "No description added yet."}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#A5ADA4]">
                  <span>
                    {project.members.length}{" "}
                    {project.members.length === 1 ? "member" : "members"}
                  </span>
                  <span className="text-[#C5F36B]">
                    Open project →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
