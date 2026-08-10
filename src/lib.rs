use reqwest::Client;
use serde::Deserialize;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ChannelDetails {
    id: String,
    title: String,
    thumbnail_url: String,
    thumbnail_small_url: String,
}

#[wasm_bindgen]
impl ChannelDetails {
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String { self.id.clone() }

    #[wasm_bindgen(getter)]
    pub fn title(&self) -> String { self.title.clone() }

    #[wasm_bindgen(getter)]
    pub fn thumbnail_url(&self) -> String { self.thumbnail_url.clone() }

    #[wasm_bindgen(getter)]
    pub fn thumbnail_small_url(&self) -> String { self.thumbnail_small_url.clone() }
}

#[derive(Clone, Deserialize)]
struct Thumbnail {
    url: String,
}

#[derive(Deserialize)]
struct Thumbnails {
    default: Option<Thumbnail>,
    medium: Option<Thumbnail>,
    high: Option<Thumbnail>,
}

#[derive(Deserialize)]
struct Snippet {
    title: String,
    thumbnails: Thumbnails,
}

#[derive(Deserialize)]
struct Item {
    pub id: String,
    pub snippet: Option<Snippet>,
}

#[derive(Deserialize)]
struct Response {
    pub items: Option<Vec<Item>>,
}

fn extract_handle(input: &str) -> &str {
    match input.rfind('@') {
        Some(index) => &input[index + 1..],
        None => input,
    }
}

fn api_url(api_key: &str, raw_handle: &str) -> String {
    let clean_handle = extract_handle(raw_handle);
    format!(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,id&forHandle=%40{}&key={}",
        clean_handle, api_key
    )
}

#[wasm_bindgen]
pub async fn get_channel_details(api_key: &str, raw_handle: &str) -> Option<ChannelDetails> {
    let client = Client::new();
    let response = client
        .get(api_url(api_key, raw_handle))
        .header("User-Agent", "YtFeedBot v1.0.0")
        .send()
        .await
        .ok()?;

    let data: Response = response.json().await.ok()?;
    let item = data.items?.into_iter().next()?;
    let snippet = item.snippet?;

    let thumbnail_url = snippet.thumbnails.high
        .or(snippet.thumbnails.medium.clone())
        .or(snippet.thumbnails.default.clone())?
        .url;

    let thumbnail_small_url = snippet.thumbnails.default
        .or(snippet.thumbnails.medium)
        .or(snippet.thumbnails.high)?
        .url;

    Some(ChannelDetails {
        id: item.id,
        title: snippet.title,
        thumbnail_url,
        thumbnail_small_url,
    })
}
