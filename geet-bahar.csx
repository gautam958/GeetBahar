/*
  Geet Bahar Musical Group — Complete Azure Functions Backend
  ============================================================
  All endpoints in single .csx file, dispatched by query parameter ?type=...
  Storage: JSON files in %HOME%/data/ (file-based, not Blob Storage)
  Auth: Google ID token verification for admin endpoints
*/

#r "Microsoft.Azure.WebJobs.Extensions.Http"
#r "Microsoft.AspNetCore.Http"
#r "Microsoft.AspNetCore.Mvc"
#r "Newtonsoft.Json"

using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public static async Task<IActionResult> Run(HttpRequest req, ILogger log)
{
    string type = req.Query["type"].FirstOrDefault() ?? "";
    log.LogInformation($"Geet Bahar function triggered. Method={req.Method} type={type}");

    // ── CORS ─────────────────────────────────────────────────────────────────
    string origin = req.Headers["Origin"].FirstOrDefault() ?? "";
    string allowedOrigin = Environment.GetEnvironmentVariable("GB_ALLOWED_ORIGIN") ?? "*";
    
    string responseOrigin = (allowedOrigin == "*" || origin == allowedOrigin)
        ? (string.IsNullOrEmpty(origin) ? "*" : origin)
        : allowedOrigin;

    // Preflight
    if (req.Method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
    {
        return CorsResult(new NoContentResult(), responseOrigin);
    }

    // Block unauthorized origins
    if (allowedOrigin != "*" && !string.IsNullOrEmpty(origin) && origin != allowedOrigin)
    {
        log.LogWarning($"Blocked unauthorized origin: {origin}");
        return CorsResult(new StatusCodeResult(403), responseOrigin);
    }

    // ── File paths ───────────────────────────────────────────────────────────
    string rootPath = Environment.GetEnvironmentVariable("HOME") ?? AppContext.BaseDirectory;
    string dataDir = Path.Combine(rootPath, "data");
    Directory.CreateDirectory(dataDir);
    Directory.CreateDirectory(Path.Combine(dataDir, "media"));

    // Initialize data files if they don't exist
    var fileMap = new Dictionary<string, string>
    {
        { "config", Path.Combine(dataDir, "GB_site_config.json") },
        { "content", Path.Combine(dataDir, "GB_content.json") },
        { "gallery", Path.Combine(dataDir, "GB_galleries.json") },
        { "rates", Path.Combine(dataDir, "GB_rates.json") },
        { "analytics", Path.Combine(dataDir, "GB_analytics.json") },
        { "visitors", Path.Combine(dataDir, "GB_visitors.json") },
        { "contact", Path.Combine(dataDir, "GB_contact_submissions.json") },
        { "language_strings", Path.Combine(dataDir, "GB_language_strings.json") },
        { "themes", Path.Combine(dataDir, "GB_themes.json") }
    };

    foreach (var path in fileMap.Values)
    {
        if (!File.Exists(path))
            File.WriteAllText(path, "{}");
    }

    bool isGet = req.Method.Equals("GET", StringComparison.OrdinalIgnoreCase);
    bool isPost = req.Method.Equals("POST", StringComparison.OrdinalIgnoreCase);
    bool isDelete = req.Method.Equals("DELETE", StringComparison.OrdinalIgnoreCase);
    bool isPatch = req.Method.Equals("PATCH", StringComparison.OrdinalIgnoreCase);

    // ═════════════════════════════════════════════════════════════════════════
    // type=config, GET — public
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "config" && isGet)
    {
        string json = File.ReadAllText(fileMap["config"]);
        JObject config = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        return CorsResult(new OkObjectResult(config), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=config, POST — admin: merge-update
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "config" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject partial;
        try { partial = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string existing = File.ReadAllText(fileMap["config"]);
        JObject current = string.IsNullOrWhiteSpace(existing) ? new JObject() : JObject.Parse(existing);
        current.Merge(partial, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Replace });
        File.WriteAllText(fileMap["config"], current.ToString(Formatting.Indented));

        log.LogInformation($"Config updated by {auth.email}");
        return CorsResult(new OkObjectResult(current), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=content, GET — public
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "content" && isGet)
    {
        string json = File.ReadAllText(fileMap["content"]);
        JObject content = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        return CorsResult(new OkObjectResult(content), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=content, POST — admin: merge-update
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "content" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject partial;
        try { partial = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string existing = File.ReadAllText(fileMap["content"]);
        JObject current = string.IsNullOrWhiteSpace(existing) ? new JObject() : JObject.Parse(existing);
        current.Merge(partial, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Replace });
        File.WriteAllText(fileMap["content"], current.ToString(Formatting.Indented));

        log.LogInformation($"Content updated by {auth.email}");
        return CorsResult(new OkObjectResult(current), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=rates, GET — public
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "rates" && isGet)
    {
        string json = File.ReadAllText(fileMap["rates"]);
        JObject rates = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        return CorsResult(new OkObjectResult(rates), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=rates, POST — admin: merge-update
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "rates" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject partial;
        try { partial = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string existing = File.ReadAllText(fileMap["rates"]);
        JObject current = string.IsNullOrWhiteSpace(existing) ? new JObject() : JObject.Parse(existing);
        current.Merge(partial, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Replace });
        File.WriteAllText(fileMap["rates"], current.ToString(Formatting.Indented));

        log.LogInformation($"Rates updated by {auth.email}");
        return CorsResult(new OkObjectResult(current), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=gallery, GET — public: list photos/videos
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "gallery" && isGet)
    {
        string json = File.ReadAllText(fileMap["gallery"]);
        JObject galleries = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        return CorsResult(new OkObjectResult(galleries), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=gallery, POST — admin: REPLACE the stored photos/videos arrays
    // with whatever is in the request body.
    //
    // IMPORTANT: the frontend always sends the FULL { photos: [...],
    // videos: [...] } object on every save — never a single item to
    // append. The previous version of this handler treated the entire
    // posted body as one gallery item and pushed it onto galleries["photos"]
    // (defaulting there since the posted object has no "category" field).
    // That meant every single save wrapped the *entire previous gallery
    // state* as one more nested array element, compounding on every
    // upload — which is exactly the deeply-nested corruption you'd see if
    // you fetched ?type=gallery directly. This version overwrites the
    // stored arrays outright, which is what a "replace" POST should do.
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "gallery" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject posted;
        try { posted = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        var clean = new JObject
        {
            ["photos"] = posted["photos"] as JArray ?? new JArray(),
            ["videos"] = posted["videos"] as JArray ?? new JArray()
        };

        File.WriteAllText(fileMap["gallery"], clean.ToString(Formatting.Indented));
        log.LogInformation($"Gallery replaced by {auth.email}: {((JArray)clean["photos"]).Count} photos, {((JArray)clean["videos"]).Count} videos");
        return CorsResult(new OkObjectResult(new { status = "saved" }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=gallery, DELETE — admin: remove one item by id.
    //
    // Rewritten to search the ENTIRE stored JSON recursively (not just the
    // top-level photos/videos arrays) — this matters because any data
    // corrupted by the old POST bug above has real items buried inside
    // nested wrapper objects, not at the top level, which is exactly why
    // DELETE was always returning 404 "Item not found" even for items
    // that were clearly visible in the admin panel (the panel recovers
    // them via a similar recursive scan on the frontend). This version
    // finds the item wherever it actually is, removes it, and writes back
    // a clean flat structure — which also self-heals the stored data over
    // time, since every delete now leaves a properly flat file behind.
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "gallery" && isDelete)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string id = req.Query["id"].FirstOrDefault();
        if (string.IsNullOrEmpty(id))
            return CorsResult(new BadRequestObjectResult(new { error = "Missing id parameter" }), responseOrigin);

        string json = File.ReadAllText(fileMap["gallery"]);
        JToken root = string.IsNullOrWhiteSpace(json) ? new JObject() : JToken.Parse(json);

        var photos = new List<JObject>();
        var videos = new List<JObject>();
        var seenIds = new HashSet<string>();

        void Walk(JToken node)
        {
            if (node == null) return;
            if (node.Type == JTokenType.Array)
            {
                foreach (var child in (JArray)node) Walk(child);
                return;
            }
            if (node.Type != JTokenType.Object) return;
            var obj = (JObject)node;
            string itemId = obj["id"]?.Value<string>();
            string filename = obj["filename"]?.Value<string>();
            if (itemId != null && filename != null)
            {
                // Leaf item (has both id and filename) — record it and
                // don't recurse further into it.
                if (seenIds.Add(itemId))
                {
                    if (itemId.StartsWith("video-")) videos.Add(obj);
                    else photos.Add(obj);
                }
                return;
            }
            foreach (var prop in obj.Properties()) Walk(prop.Value);
        }
        Walk(root);

        bool found = seenIds.Contains(id);
        photos.RemoveAll(p => p["id"]?.Value<string>() == id);
        videos.RemoveAll(v => v["id"]?.Value<string>() == id);

        var clean = new JObject
        {
            ["photos"] = new JArray(photos),
            ["videos"] = new JArray(videos)
        };
        File.WriteAllText(fileMap["gallery"], clean.ToString(Formatting.Indented));

        if (!found)
        {
            log.LogWarning($"Gallery delete requested for unknown id {id} by {auth.email} — wrote cleaned-up data anyway");
            return CorsResult(new NotFoundObjectResult(new { error = "Item not found" }), responseOrigin);
        }

        log.LogInformation($"Gallery item {id} deleted by {auth.email}");
        return CorsResult(new OkObjectResult(new { status = "deleted" }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=media, POST — admin: upload image/video
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "media" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject payload;
        try { payload = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string filename = payload.Value<string>("filename") ?? "upload";
        string dataBase64 = payload.Value<string>("dataBase64");

        if (string.IsNullOrEmpty(dataBase64))
            return CorsResult(new BadRequestObjectResult(new { error = "Missing dataBase64" }), responseOrigin);

        string base64Part = dataBase64.Contains(",") ? dataBase64.Substring(dataBase64.IndexOf(',') + 1) : dataBase64;
        byte[] bytes;
        try { bytes = Convert.FromBase64String(base64Part); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid base64" }), responseOrigin); }

        long maxBytes = long.TryParse(Environment.GetEnvironmentVariable("GB_MEDIA_MAX_BYTES"), out long cfg) ? cfg : 10 * 1024 * 1024;
        if (bytes.LongLength > maxBytes)
            return CorsResult(new ObjectResult(new { error = $"File exceeds {maxBytes / (1024 * 1024)} MB limit" }) { StatusCode = 413 }, responseOrigin);

        string ext = Path.GetExtension(filename);
        string safeName = $"{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}{ext}";
        string savePath = Path.Combine(dataDir, "media", safeName);
        File.WriteAllBytes(savePath, bytes);

        log.LogInformation($"Media uploaded by {auth.email}: {safeName} ({bytes.Length} bytes)");
        return CorsResult(new OkObjectResult(new { filename = safeName }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=media, GET — public: serve uploaded file
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "media" && isGet)
    {
        string fileParam = req.Query["file"].FirstOrDefault() ?? "";

        if (string.IsNullOrEmpty(fileParam) || fileParam.Contains("..") || fileParam.Contains("/") || fileParam.Contains("\\"))
            return CorsResult(new BadRequestObjectResult(new { error = "Invalid file parameter" }), responseOrigin);

        string filePath = Path.Combine(dataDir, "media", fileParam);
        if (!File.Exists(filePath))
            return CorsResult(new NotFoundObjectResult(new { error = "File not found" }), responseOrigin);

        string ext = Path.GetExtension(fileParam).ToLowerInvariant();
        string mime = ext switch
        {
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            _ => "application/octet-stream"
        };

        byte[] fileBytes = File.ReadAllBytes(filePath);
        return new FileContentResult(fileBytes, mime);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=track_visitor, POST — anonymous: log page view + visitor
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "track_visitor" && isPost)
    {
        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject payload;
        try { payload = JObject.Parse(body); }
        catch { payload = new JObject(); }

        string pagePath = payload.Value<string>("path") ?? "/";
        string visitorId = payload.Value<string>("visitorId") ?? "";
        string today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        string nowIso = DateTime.UtcNow.ToString("o");

        // Page view aggregation
        string analyticsJson = File.ReadAllText(fileMap["analytics"]);
        JObject analytics = string.IsNullOrWhiteSpace(analyticsJson) ? new JObject() : JObject.Parse(analyticsJson);

        var byDay = (JObject)(analytics["byDay"] ?? (analytics["byDay"] = new JObject()));
        var byPath = (JObject)(analytics["byPath"] ?? (analytics["byPath"] = new JObject()));
        byDay[today] = (byDay[today]?.Value<int>() ?? 0) + 1;
        byPath[pagePath] = (byPath[pagePath]?.Value<int>() ?? 0) + 1;
        analytics["lastUpdated"] = nowIso;
        File.WriteAllText(fileMap["analytics"], analytics.ToString(Formatting.Indented));

        // Visitor registry
        if (!string.IsNullOrEmpty(visitorId))
        {
            string visitorsJson = File.ReadAllText(fileMap["visitors"]);
            JObject visitorsRoot = string.IsNullOrWhiteSpace(visitorsJson) ? new JObject() : JObject.Parse(visitorsJson);
            var visitorsArr = (JArray)(visitorsRoot["visitors"] ?? (visitorsRoot["visitors"] = new JArray()));

            JObject existingVisitor = visitorsArr.OfType<JObject>()
                .FirstOrDefault(v => v.Value<string>("visitorId") == visitorId);

            string clientIp = GetClientIp(req);

            if (existingVisitor != null)
            {
                existingVisitor["visitCount"] = (existingVisitor["visitCount"]?.Value<int>() ?? 1) + 1;
                existingVisitor["lastVisit"] = nowIso;
            }
            else
            {
                var geo = await LookupGeoAsync(clientIp, log);
                visitorsArr.Add(new JObject
                {
                    ["visitorId"] = visitorId,
                    ["ip"] = clientIp,
                    ["country"] = geo.country,
                    ["state"] = geo.state,
                    ["city"] = geo.city,
                    ["firstVisit"] = nowIso,
                    ["lastVisit"] = nowIso,
                    ["visitCount"] = 1
                });
            }

            File.WriteAllText(fileMap["visitors"], visitorsRoot.ToString(Formatting.Indented));
        }

        return CorsResult(new NoContentResult(), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=analytics, GET — admin: aggregates and trends
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "analytics" && isGet)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string analyticsJson = File.ReadAllText(fileMap["analytics"]);
        JObject analytics = string.IsNullOrWhiteSpace(analyticsJson) ? new JObject() : JObject.Parse(analyticsJson);

        var byDay = (JObject)(analytics["byDay"] ?? new JObject());
        var byPath = (JObject)(analytics["byPath"] ?? new JObject());

        string cutoff = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
        var filteredByDay = new JObject();
        int totalViews = 0;
        foreach (var prop in byDay.Properties())
        {
            if (string.Compare(prop.Name, cutoff) >= 0)
            {
                filteredByDay[prop.Name] = prop.Value;
                totalViews += prop.Value.Value<int>();
            }
        }

        var topPaths = byPath.Properties()
            .OrderByDescending(p => p.Value.Value<int>())
            .Take(10)
            .ToDictionary(p => p.Name, p => p.Value.Value<int>());

        // Visitor data
        string visitorsJson = File.ReadAllText(fileMap["visitors"]);
        JObject visitorsRoot = string.IsNullOrWhiteSpace(visitorsJson) ? new JObject() : JObject.Parse(visitorsJson);
        var visitorObjs = ((visitorsRoot["visitors"] as JArray) ?? new JArray()).OfType<JObject>().ToList();

        int totalVisitors = visitorObjs.Count;
        DateTime thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        int newVisitors = visitorObjs.Count(v =>
            DateTime.TryParse(v.Value<string>("firstVisit"), null, System.Globalization.DateTimeStyles.RoundtripKind, out var fv)
            && fv >= thirtyDaysAgo);
        int repeatVisitors = visitorObjs.Count(v => (v.Value<int?>("visitCount") ?? 1) > 1);

        var byCountry = visitorObjs.GroupBy(v => v.Value<string>("country") ?? "Unknown")
            .OrderByDescending(g => g.Count()).Take(10).ToDictionary(g => g.Key, g => g.Count());
        var byCity = visitorObjs.GroupBy(v => v.Value<string>("city") ?? "Unknown")
            .OrderByDescending(g => g.Count()).Take(10).ToDictionary(g => g.Key, g => g.Count());

        var recentVisitors = visitorObjs
            .OrderByDescending(v => v.Value<string>("lastVisit"))
            .Take(25)
            .Select(v => new
            {
                country = v.Value<string>("country"),
                city = v.Value<string>("city"),
                visitCount = v.Value<int?>("visitCount") ?? 1,
                lastVisit = v.Value<string>("lastVisit")
            })
            .ToList();

        return CorsResult(new OkObjectResult(new
        {
            views = new { total = totalViews, byDay = filteredByDay, byPath = topPaths },
            visitors = new
            {
                total = totalVisitors,
                newVisitors = newVisitors,
                repeatVisitors = repeatVisitors,
                byCountry = byCountry,
                byCity = byCity,
                recent = recentVisitors
            }
        }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=contact_submit, POST — anonymous: form submission
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "contact_submit" && isPost)
    {
        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject submission;
        try { submission = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string json = File.ReadAllText(fileMap["contact"]);
        JObject contactRoot = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        var submissions = (JArray)(contactRoot["submissions"] ?? (contactRoot["submissions"] = new JArray()));

        submission["id"] = Guid.NewGuid().ToString();
        submission["submittedAt"] = DateTime.UtcNow.ToString("o");
        submission["status"] = "new";
        submissions.Add(submission);

        File.WriteAllText(fileMap["contact"], contactRoot.ToString(Formatting.Indented));
        log.LogInformation($"Contact submission from {submission["email"]}");
        return CorsResult(new OkObjectResult(new { id = submission["id"] }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=contact_submissions, GET — admin: list submissions
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "contact_submissions" && isGet)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string json = File.ReadAllText(fileMap["contact"]);
        JObject contactRoot = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        var submissions = ((contactRoot["submissions"] as JArray) ?? new JArray())
            .OrderByDescending(s => s["submittedAt"]?.Value<string>())
            .ToList();

        return CorsResult(new OkObjectResult(new { submissions = submissions }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=contact_submissions, PATCH — admin: update submission status
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "contact_submissions" && isPatch)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string id = req.Query["id"].FirstOrDefault();
        string status = req.Query["status"].FirstOrDefault();

        if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(status))
            return CorsResult(new BadRequestObjectResult(new { error = "Missing id or status" }), responseOrigin);

        string json = File.ReadAllText(fileMap["contact"]);
        JObject contactRoot = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        var submissions = contactRoot["submissions"] as JArray;

        if (submissions != null)
        {
            var item = submissions.FirstOrDefault(s => s["id"]?.Value<string>() == id);
            if (item != null)
            {
                item["status"] = status;
                File.WriteAllText(fileMap["contact"], contactRoot.ToString(Formatting.Indented));
                return CorsResult(new OkObjectResult(new { status = "updated" }), responseOrigin);
            }
        }

        return CorsResult(new NotFoundObjectResult(new { error = "Submission not found" }), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=language_strings, GET — public: bilingual UI labels
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "language_strings" && isGet)
    {
        string json = File.ReadAllText(fileMap["language_strings"]);
        JObject strings = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        return CorsResult(new OkObjectResult(strings), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=language_strings, POST — admin: update UI labels
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "language_strings" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject partial;
        try { partial = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string existing = File.ReadAllText(fileMap["language_strings"]);
        JObject current = string.IsNullOrWhiteSpace(existing) ? new JObject() : JObject.Parse(existing);
        current.Merge(partial, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Replace });
        File.WriteAllText(fileMap["language_strings"], current.ToString(Formatting.Indented));

        log.LogInformation($"Language strings updated by {auth.email}");
        return CorsResult(new OkObjectResult(current), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=themes, GET — public: theme definitions
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "themes" && isGet)
    {
        string json = File.ReadAllText(fileMap["themes"]);
        JObject themes = string.IsNullOrWhiteSpace(json) ? new JObject() : JObject.Parse(json);
        return CorsResult(new OkObjectResult(themes), responseOrigin);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // type=themes, POST — admin: update themes
    // ═════════════════════════════════════════════════════════════════════════
    if (type == "themes" && isPost)
    {
        var auth = await VerifyAdminAsync(req, log);
        if (!auth.ok)
            return CorsResult(new UnauthorizedObjectResult(new { error = auth.error }), responseOrigin);

        string body = await new StreamReader(req.Body).ReadToEndAsync();
        JObject partial;
        try { partial = JObject.Parse(body); }
        catch { return CorsResult(new BadRequestObjectResult(new { error = "Invalid JSON" }), responseOrigin); }

        string existing = File.ReadAllText(fileMap["themes"]);
        JObject current = string.IsNullOrWhiteSpace(existing) ? new JObject() : JObject.Parse(existing);
        current.Merge(partial, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Replace });
        File.WriteAllText(fileMap["themes"], current.ToString(Formatting.Indented));

        log.LogInformation($"Themes updated by {auth.email}");
        return CorsResult(new OkObjectResult(current), responseOrigin);
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
    return CorsResult(new OkObjectResult(new
    {
        service = "Geet Bahar API",
        status = "running",
        endpoints = new[] {
            "GET  ?type=config|content|rates|gallery|language_strings|themes",
            "POST ?type=config|content|rates|gallery|media|language_strings|themes",
            "GET  ?type=media&file=<name>",
            "DELETE ?type=gallery&id=<id>",
            "POST ?type=track_visitor (anonymous)",
            "GET  ?type=analytics (admin)",
            "POST ?type=contact_submit (anonymous)",
            "GET  ?type=contact_submissions (admin)",
            "PATCH ?type=contact_submissions&id=<id>&status=<status> (admin)"
        }
    }), responseOrigin);
}

// ─────────────────────────────────────────────────────────────────────────────
// CORS wrapper
// ─────────────────────────────────────────────────────────────────────────────
private static IActionResult CorsResult(IActionResult result, string origin)
{
    return new CorsWrappedResult(result, origin);
}

private class CorsWrappedResult : IActionResult
{
    private readonly IActionResult _inner;
    private readonly string _origin;

    public CorsWrappedResult(IActionResult inner, string origin)
    {
        _inner = inner;
        _origin = origin;
    }

    public async Task ExecuteResultAsync(ActionContext context)
    {
        context.HttpContext.Response.Headers["Access-Control-Allow-Origin"] = _origin;
        context.HttpContext.Response.Headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
        context.HttpContext.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, PATCH, OPTIONS";
        await _inner.ExecuteResultAsync(context);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Google ID token verification
// ─────────────────────────────────────────────────────────────────────────────
private static readonly HttpClient _httpClient = new HttpClient();

private static async Task<(bool ok, string error, string email)> VerifyAdminAsync(HttpRequest req, ILogger log)
{
    string authHeader = req.Headers["Authorization"].FirstOrDefault() ?? "";
    if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        return (false, "Missing Authorization header", null);

    string token = authHeader.Substring("Bearer ".Length).Trim();
    if (string.IsNullOrEmpty(token))
        return (false, "Empty token", null);

    string expectedAudience = Environment.GetEnvironmentVariable("GB_GOOGLE_CLIENT_ID") ?? "";
    string adminEmailsRaw = Environment.GetEnvironmentVariable("GB_ADMIN_EMAILS") ?? "";
    var adminEmails = adminEmailsRaw.Split(',').Select(e => e.Trim().ToLowerInvariant()).Where(e => e.Length > 0).ToHashSet();

    HttpResponseMessage tokenInfoResponse;
    try
    {
        tokenInfoResponse = await _httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(token)}");
    }
    catch (Exception ex)
    {
        log.LogError(ex, "Google tokeninfo failed");
        return (false, "Could not verify token", null);
    }

    if (!tokenInfoResponse.IsSuccessStatusCode)
        return (false, "Invalid or expired token", null);

    JObject info;
    try { info = JObject.Parse(await tokenInfoResponse.Content.ReadAsStringAsync()); }
    catch { return (false, "Could not parse tokeninfo", null); }

    string aud = info.Value<string>("aud") ?? "";
    string email = info.Value<string>("email") ?? "";
    string emailVerified = info.Value<string>("email_verified") ?? "";

    if (string.IsNullOrEmpty(expectedAudience) || aud != expectedAudience)
        return (false, "Token aud mismatch", null);

    if (emailVerified != "true")
        return (false, "Email not verified", null);

    if (adminEmails.Count > 0 && !adminEmails.Contains(email.ToLowerInvariant()))
        return (false, $"{email} not in admin list", null);

    return (true, null, email);
}

// ─────────────────────────────────────────────────────────────────────────────
// Client IP extraction
// ─────────────────────────────────────────────────────────────────────────────
private static string GetClientIp(HttpRequest req)
{
    string forwarded = req.Headers["X-Forwarded-For"].FirstOrDefault();
    if (!string.IsNullOrEmpty(forwarded))
        return forwarded.Split(',')[0].Trim();
    return req.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// GeoIP lookup
// ─────────────────────────────────────────────────────────────────────────────
private static readonly HttpClient _geoClient = new HttpClient();

private static async Task<(string country, string state, string city)> LookupGeoAsync(string ip, ILogger log)
{
    if (string.IsNullOrEmpty(ip) || ip == "::1" || ip.StartsWith("127.") || ip.StartsWith("10.") || ip.StartsWith("192.168.") || ip == "Unknown")
        return ("Unknown", "Unknown", "Unknown");

    if (ip.Count(c => c == ':') == 1)
        ip = ip.Split(':')[0]; // strip a port from "ipv4:port" — an IPv6
                                // address has multiple colons and must be
                                // left as-is, or the lookup below silently
                                // fails for it every time (this previously
                                // took only the first ':'-separated chunk of
                                // ANY address, mangling every IPv6 client's
                                // address into garbage before it ever
                                // reached ip-api.com — a likely real cause
                                // of "Unknown" city/state/country for a lot
                                // of real visitors, especially on mobile
                                // carriers that are IPv6-only).

    try
    {
        var response = await _geoClient.GetAsync($"http://ip-api.com/json/{Uri.EscapeDataString(ip)}?fields=status,country,regionName,city");
        if (!response.IsSuccessStatusCode)
            return ("Unknown", "Unknown", "Unknown");

        var json = JObject.Parse(await response.Content.ReadAsStringAsync());
        if (json.Value<string>("status") != "success")
            return ("Unknown", "Unknown", "Unknown");

        return (
            json.Value<string>("country") ?? "Unknown",
            json.Value<string>("regionName") ?? "Unknown",
            json.Value<string>("city") ?? "Unknown"
        );
    }
    catch (Exception ex)
    {
        log.LogWarning($"GeoIP lookup failed for {ip}: {ex.Message}");
        return ("Unknown", "Unknown", "Unknown");
    }
}
