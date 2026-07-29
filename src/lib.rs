use reqwest::Client;
use serde::Deserialize;
use wasm_bindgen::prelude::*;

#[derive(Deserialize)]
struct Item {
    pub id: String,
}

#[derive(Deserialize)]
struct Response {
    pub items: Option<Vec<Item>>,
}

/// Extracts the clean handle string from raw inputs like "@username" or full URLs.
fn extract_handle(input: &str) -> &str {
    match input.rfind('@') {
        Some(index) => &input[index + 1..],
        None => input,
    }
}

fn api_url(api_key: &str, raw_handle: &str) -> String {
    let clean_handle = extract_handle(raw_handle);
    format!(
        "https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=%40{}&key={}",
        clean_handle, api_key
    )
}

#[wasm_bindgen]
pub async fn get_channel_id(api_key: &str, raw_handle: &str) -> Option<String> {
    let client = Client::new();
    let response = client
        .get(api_url(api_key, raw_handle))
        .header("User-Agent", "YtFeedBot v1.0.0")
        .send()
        .await
        .ok()?;

    let data: Response = response.json().await.ok()?;

    // Return the ID of the first matching item
    data.items?.into_iter().next().map(|item| item.id)
}
