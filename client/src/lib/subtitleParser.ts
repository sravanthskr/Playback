interface SubtitleItem {
  start: number;
  end: number;
  text: string;
}

export function parseSRT(content: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  blocks.forEach((block) => {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      
      if (timeMatch) {
        const start = timeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
        const end = timeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
        const text = lines.slice(2).join("\n").replace(/<[^>]*>/g, ""); // Remove HTML tags
        
        subtitles.push({ start, end, text });
      }
    }
  });

  return subtitles;
}

export function parseVTT(content: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = [];
  const lines = content.split("\n");
  let i = 0;

  // Skip header
  while (i < lines.length && !lines[i].includes("-->")) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line.includes("-->")) {
      const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
      
      if (timeMatch) {
        const start = timeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
        const end = timeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
        
        i++;
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== "") {
          textLines.push(lines[i].trim());
          i++;
        }
        
        const text = textLines.join("\n").replace(/<[^>]*>/g, ""); // Remove HTML tags
        subtitles.push({ start, end, text });
      }
    }
    i++;
  }

  return subtitles;
}

export function parseASS(content: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = [];
  const lines = content.split("\n");
  let inEvents = false;
  let formatLine = "";

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === "[Events]") {
      inEvents = true;
      continue;
    }
    
    if (trimmed.startsWith("[") && trimmed !== "[Events]") {
      inEvents = false;
      continue;
    }
    
    if (inEvents) {
      if (trimmed.startsWith("Format:")) {
        formatLine = trimmed;
      } else if (trimmed.startsWith("Dialogue:")) {
        const dialogue = parseASSDialogue(trimmed, formatLine);
        if (dialogue) {
          subtitles.push(dialogue);
        }
      }
    }
  }

  return subtitles;
}

function parseASSDialogue(dialogueLine: string, formatLine: string): SubtitleItem | null {
  const formatParts = formatLine.replace("Format:", "").split(",").map(s => s.trim());
  const dialogueParts = dialogueLine.replace("Dialogue:", "").split(",");
  
  const startIndex = formatParts.indexOf("Start");
  const endIndex = formatParts.indexOf("End");
  const textIndex = formatParts.indexOf("Text");
  
  if (startIndex === -1 || endIndex === -1 || textIndex === -1) {
    return null;
  }
  
  const start = assTimeToMs(dialogueParts[startIndex]);
  const end = assTimeToMs(dialogueParts[endIndex]);
  const text = dialogueParts.slice(textIndex).join(",").replace(/\{[^}]*\}/g, ""); // Remove ASS formatting
  
  return { start, end, text };
}

function timeToMs(hours: string, minutes: string, seconds: string, milliseconds: string): number {
  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(seconds) * 1000 +
    parseInt(milliseconds)
  );
}

function assTimeToMs(timeString: string): number {
  const match = timeString.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return 0;
  
  return timeToMs(match[1], match[2], match[3], match[4] + "0"); // ASS uses centiseconds
}
