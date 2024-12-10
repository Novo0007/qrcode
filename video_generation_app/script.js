
document.getElementById("generateBtn").addEventListener("click", async () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    const prompt = document.getElementById("prompt").value.trim();
    const model = "video-01";
    const outputFileName = "output.mp4";
    const statusElement = document.getElementById("status");

    if (!apiKey || !prompt) {
        statusElement.textContent = "Please provide both API key and prompt.";
        return;
    }

    const invokeVideoGeneration = async () => {
        try {
            statusElement.textContent = "Submitting video generation task...";
            const response = await fetch("https://api.minimaxi.chat/v1/video_generation", {
                method: "POST",
                headers: {
                    "authorization": `Bearer ${apiKey}`,
                    "content-type": "application/json"
                },
                body: JSON.stringify({ prompt, model })
            });

            const data = await response.json();
            if (response.ok) {
                statusElement.textContent = `Task submitted successfully. Task ID: ${data.task_id}`;
                return data.task_id;
            } else {
                throw new Error(data.message || "Error submitting task.");
            }
        } catch (error) {
            statusElement.textContent = `Error: ${error.message}`;
        }
    };

    const queryVideoGeneration = async (taskId) => {
        try {
            const response = await fetch(`https://api.minimaxi.chat/v1/query/video_generation?task_id=${taskId}`, {
                headers: {
                    "authorization": `Bearer ${apiKey}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
        }
    };

    const fetchVideoResult = async (fileId) => {
        try {
            statusElement.textContent = "Downloading the video...";
            const response = await fetch(`https://api.minimaxi.chat/v1/files/retrieve?file_id=${fileId}`, {
                headers: {
                    "authorization": `Bearer ${apiKey}`
                }
            });

            const data = await response.json();
            if (data.file && data.file.download_url) {
                const downloadResponse = await fetch(data.file.download_url);
                const blob = await downloadResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = outputFileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                statusElement.textContent = "Video downloaded successfully!";
            } else {
                throw new Error("Download URL not found.");
            }
        } catch (error) {
            statusElement.textContent = `Error: ${error.message}`;
        }
    };

    const taskId = await invokeVideoGeneration();
    if (!taskId) return;

    const pollStatus = setInterval(async () => {
        const statusResponse = await queryVideoGeneration(taskId);
        if (statusResponse.status === "Success") {
            clearInterval(pollStatus);
            await fetchVideoResult(statusResponse.file_id);
        } else if (statusResponse.status === "Fail") {
            clearInterval(pollStatus);
            statusElement.textContent = "Video generation failed.";
        } else {
            statusElement.textContent = `Current Status: ${statusResponse.status}`;
        }
    }, 10000);
});
