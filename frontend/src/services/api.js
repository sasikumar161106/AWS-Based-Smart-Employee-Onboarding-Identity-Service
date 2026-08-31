const API_BASE_URL =
  "https://a7zwjzeyug.execute-api.ap-south-1.amazonaws.com/prod";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function submitEmployee(employeeData) {
  const response = await fetch(`${API_BASE_URL}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });

  return handleResponse(response);
}

export async function getEmployeeProgress(employeeId) {
  const response = await fetch(
    `${API_BASE_URL}/progress/${encodeURIComponent(employeeId)}`
  );

  return handleResponse(response);
}

export async function getAdminPipeline(status = "PENDING") {
  const response = await fetch(
    `${API_BASE_URL}/admin/pipeline?status=${encodeURIComponent(status)}`
  );

  return handleResponse(response);
}