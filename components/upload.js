export function uploadInit() {
  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("exam-files");
  const previewContainer = document.getElementById("preview-container");

  let selectedFiles = [];

  fileInput.addEventListener("change", (e) => {
    previewContainer.innerHTML = "";
    selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach((file, i) => {
      const div = document.createElement("div");
      div.innerText = `Page ${i + 1}: ${file.name}`;
      previewContainer.appendChild(div);
    });
  });

  uploadBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) return alert("Select at least one file!");

    const examMeta = {
      title: document.getElementById("exam-title").value || "",
      university_id: document.getElementById("university-select").value,
      course_id: document.getElementById("course-select").value,
    };

    await uploadExam(selectedFiles, examMeta);

    // Reset
    fileInput.value = "";
    previewContainer.innerHTML = "";
    selectedFiles = [];
  });
}

async function uploadExam(files, examMeta) {
  try {
    const examId = crypto.randomUUID();
    const ownerId = window.sessionData.user.id;

    const uploadedPages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop();
      const filePath = `exam-files/${ownerId}/${examId}/page-${i + 1}.${ext}`;

      const { data, error } = await supabase.storage
        .from("exam-files")
        .upload(filePath, file);

      if (error) throw error;

      const { publicUrl } = supabase.storage
        .from("exam-files")
        .getPublicUrl(filePath);

      uploadedPages.push(publicUrl);
    }

    const { data, error: dbError } = await supabase
      .from("exams")
      .insert({
        id: examId,
        owner_id: ownerId,
        university_id: examMeta.university_id,
        course_id: examMeta.course_id,
        title: examMeta.title,
        pages: uploadedPages,
      });

    if (dbError) throw dbError;

    alert("Exam uploaded successfully!");
    return data;

  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed: " + err.message);
  }
}
