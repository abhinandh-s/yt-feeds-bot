// @generated file from wasmbuild -- do not edit
// deno-lint-ignore-file
// deno-fmt-ignore-file

export class ChannelDetails {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly id: string;
  readonly thumbnail_url: string;
  readonly title: string;
}

export function get_channel_details(
  api_key: string,
  raw_handle: string,
): Promise<ChannelDetails | undefined>;
