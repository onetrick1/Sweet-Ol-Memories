"use server";

export async function addVoice(formData: FormData) {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) throw new Error("ELEVEN_LABS_API_KEY is not set");

    try {
        const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail?.status || "Failed to add voice");
        }

        return await response.json();
    } catch (error) {
        console.error("Error adding voice:", error);
        throw error;
    }
}

export async function listVoices() {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) throw new Error("ELEVEN_LABS_API_KEY is not set");

    try {
        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
            method: "GET",
            headers: {
                "xi-api-key": apiKey,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch voices");
        }

        const data = await response.json();
        return data.voices;
    } catch (error) {
        console.error("Error listing voices:", error);
        throw error;
    }
}
