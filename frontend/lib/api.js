// All backend calls go through this file.
// Flip USE_MOCKS to false to hit the real FastAPI backend at NEXT_PUBLIC_API_URL.
import { users, DEMO_COMPANY_ID, DEMO_EXPERT_ID } from "@/mocks/users";
import { gigs } from "@/mocks/gigs";
import { DEMO_CLIP_URL, demoClipSegments, tasks } from "@/mocks/tasks";
import { annotations } from "@/mocks/annotations";
import { consensusByTask } from "@/mocks/consensus";
import { dashboardByGig } from "@/mocks/dashboard";
import { earningsByExpert } from "@/mocks/earnings";
import { issuesByGig } from "@/mocks/aiIssues";

export const USE_MOCKS = true;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MOCK_DELAY_MS = 300;

// Returns a deep copy after a short delay so screens exercise their loading states.
function mock(data) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(structuredClone(data)), MOCK_DELAY_MS)
  );
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: isFormData
      ? options.headers
      : { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Core (Person 2) ----------

// Until Firebase Auth lands, the chosen role maps to a fixed demo user.
export function getCurrentUser(role) {
  const id = role === "company" ? DEMO_COMPANY_ID : role === "expert" ? DEMO_EXPERT_ID : null;
  if (!id) return Promise.resolve(null);
  return getUser(id);
}

export function getUser(id) {
  if (USE_MOCKS) return mock(users.find((u) => u.id === id) ?? null);
  return request(`/users/${id}`);
}

export function listGigs(companyId) {
  if (USE_MOCKS) return mock(gigs.filter((g) => g.company_id === companyId));
  return request(`/gigs?company_id=${encodeURIComponent(companyId)}`);
}

// formData: company_id, title, sop_steps (JSON string), raters_required, required_specialty,
// pay_per_task, compute_provider, videos (File, repeated: one task per video), sop (File, optional)
export function createGig(formData) {
  if (USE_MOCKS) {
    // Mock state lives in memory for the session, so the new gig shows up on later screens.
    const id = `gig_${Date.now()}`;
    const sopSteps = JSON.parse(formData.get("sop_steps") ?? "[]");
    const newGig = {
      ...gigs[0],
      id,
      title: formData.get("title") ?? gigs[0].title,
      sop_steps: sopSteps.length ? sopSteps : gigs[0].sop_steps,
      raters_required: Number(formData.get("raters_required") ?? 2),
      required_specialty: formData.get("required_specialty") ?? "lab_technician",
      pay_per_task: Number(formData.get("pay_per_task") ?? 12),
      status: "active",
    };
    const videos = formData.getAll("videos");
    newGig.video_url = DEMO_CLIP_URL;
    gigs.push(newGig);
    // Static for now: every video gets the demo clip and its cached Gemini response.
    videos.forEach((_, i) =>
      tasks.push({
        id: `task_${Date.now()}_${i + 1}`,
        gig_id: id,
        video_url: DEMO_CLIP_URL,
        assigned_rater_ids: [],
        ai_segments: demoClipSegments,
        status: "open",
      })
    );
    dashboardByGig[id] = {
      gig_id: id,
      total_tasks: videos.length,
      tasks_by_status: { open: videos.length, in_progress: 0, submitted: 0, flagged: 0, resolved: 0 },
      agreement_rate: null,
      ai_segments_accepted_rate: null,
      flagged_items: [],
    };
    return mock(newGig);
  }
  return request("/gigs", { method: "POST", body: formData });
}

export function getGig(id) {
  if (USE_MOCKS) return mock(gigs.find((g) => g.id === id) ?? null);
  return request(`/gigs/${id}`);
}

// Every task on one gig, for the company dashboard.
export function listGigTasks(gigId) {
  if (USE_MOCKS) return mock(tasks.filter((t) => t.gig_id === gigId));
  return request(`/gigs/${gigId}`).then((res) => res.tasks);
}

export function listTasks(specialty) {
  if (USE_MOCKS) {
    const listed = tasks
      .filter((t) => t.status === "open" || t.status === "in_progress")
      .map((t) => ({ ...t, gig: gigs.find((g) => g.id === t.gig_id) }))
      .filter((t) => !specialty || t.gig.required_specialty === specialty);
    return mock(listed);
  }
  const query = specialty ? `?specialty=${encodeURIComponent(specialty)}` : "";
  return request(`/tasks${query}`);
}

export function getTask(id) {
  if (USE_MOCKS) return mock(tasks.find((t) => t.id === id) ?? null);
  return request(`/tasks/${id}`);
}

// ---------- AI (Person 4, surfaced through the backend) ----------

// Gemini's review of the current annotation (check_annotation). Endpoint not defined yet.
export function checkAnnotation(taskId, gigId, segments) {
  if (USE_MOCKS) return mock(issuesByGig[gigId] ?? []);
  return request(`/tasks/${taskId}/check`, {
    method: "POST",
    body: JSON.stringify({ segments }),
  });
}

// ---------- Annotation (Person 3) ----------

// submit: false saves a draft, true submits for consensus.
export function saveAnnotation(taskId, { raterId, segments, submit }) {
  if (USE_MOCKS) {
    return mock({
      id: `ann_${Date.now()}`,
      task_id: taskId,
      rater_id: raterId,
      segments,
      submitted_at: submit ? new Date().toISOString() : null,
    });
  }
  return request(`/tasks/${taskId}/annotations`, {
    method: "POST",
    body: JSON.stringify({ rater_id: raterId, segments, submit }),
  });
}

export function getAnnotations(taskId) {
  if (USE_MOCKS) return mock(annotations.filter((a) => a.task_id === taskId));
  return request(`/tasks/${taskId}/annotations`);
}

export function getConsensus(taskId) {
  if (USE_MOCKS) return mock(consensusByTask[taskId] ?? null);
  return request(`/tasks/${taskId}/consensus`);
}

// resolution: final agreed segments chosen by the adjudicator.
export function adjudicate(taskId, { actorId, segments }) {
  if (USE_MOCKS) {
    // Resolve the task and update its gig's dashboard so the company view reflects it.
    const task = tasks.find((t) => t.id === taskId);
    const dashboard = task && dashboardByGig[task.gig_id];
    if (task && task.status !== "resolved") {
      if (dashboard) {
        dashboard.tasks_by_status[task.status] -= 1;
        dashboard.tasks_by_status.resolved += 1;
        dashboard.flagged_items = dashboard.flagged_items.filter((f) => f.task_id !== taskId);
      }
      task.status = "resolved";
    }
    return mock({ task_id: taskId, status: "resolved", segments });
  }
  return request(`/tasks/${taskId}/adjudicate`, {
    method: "POST",
    body: JSON.stringify({ actor_id: actorId, segments }),
  });
}

export function getDashboard(gigId) {
  if (USE_MOCKS) return mock(dashboardByGig[gigId] ?? null);
  return request(`/gigs/${gigId}/dashboard`);
}

export function exportGig(gigId) {
  if (USE_MOCKS) {
    const gigTasks = tasks.filter(
      (t) => t.gig_id === gigId && t.status === "resolved"
    );
    return mock({
      gig_id: gigId,
      exported_at: new Date().toISOString(),
      tasks: gigTasks.map((t) => ({ task_id: t.id, segments: t.ai_segments })),
    });
  }
  return request(`/gigs/${gigId}/export`);
}

// Display only. No real payments.
export function getEarnings(expertId) {
  if (USE_MOCKS) return mock(earningsByExpert[expertId] ?? null);
  return request(`/experts/${expertId}/earnings`);
}
