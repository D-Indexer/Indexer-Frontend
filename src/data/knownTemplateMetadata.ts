/**
 * Template metadata registered on-chain by Indexer-Contract (templates/<id>.json, commit 538188b).
 *
 * These are the exact bytes behind each template CID, so they are real content-addressed data, not
 * fixtures: `resolveTemplateMetadata` only uses an entry after recomputing its CID and matching it
 * against the on-chain `metadata_uri`. They let templates render when a public gateway has not
 * cached the files yet.
 */
export const knownTemplateMetadata: Record<string, string> = {
  "bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i": "{\n  \"schema_version\": 1,\n  \"template_id\": 1,\n  \"name\": \"Developer\",\n  \"description\": \"Clean single-page layout for software engineers.\",\n  \"target_industry\": \"Software Engineering\",\n  \"fields\": [\n    \"bio\",\n    \"github\",\n    \"skills\",\n    \"projects\",\n    \"work_history\"\n  ]\n}\n",
  "bafkreibl5hwjqwglhrzjepbapjzko74h5zaec5mncnw4u4crn3pejeytgi": "{\n  \"schema_version\": 1,\n  \"template_id\": 2,\n  \"name\": \"Designer\",\n  \"description\": \"Visual-first gallery layout for UI/UX and creative work.\",\n  \"target_industry\": \"UI/UX & Creative\",\n  \"fields\": [\n    \"bio\",\n    \"portfolio_images\",\n    \"case_studies\",\n    \"tools\",\n    \"contact\"\n  ]\n}\n",
  "bafkreidb373xq4eldginonrutn4hrywugayklcoof2qjxgearzu36b4gg4": "{\n  \"schema_version\": 1,\n  \"template_id\": 3,\n  \"name\": \"Operations\",\n  \"description\": \"Structured résumé layout for operations and management roles.\",\n  \"target_industry\": \"Operations & Management\",\n  \"fields\": [\n    \"bio\",\n    \"experience\",\n    \"certifications\",\n    \"skills\",\n    \"references\"\n  ]\n}\n",
}
