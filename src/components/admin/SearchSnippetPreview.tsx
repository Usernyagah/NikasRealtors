import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface SearchSnippetPreviewProps {
  title: string;
  url: string;
  description: string;
}

export const SearchSnippetPreview = ({ title, url, description }: SearchSnippetPreviewProps) => {
  // Truncate cleanly for realistic Google snippet preview
  const displayTitle = title ? (title.length > 60 ? `${title.slice(0, 57)}...` : title) : "Page Title Preview";
  const displayDesc = description ? (description.length > 158 ? `${description.slice(0, 155)}...` : description) : "Meta description preview will appear here as users would see it in Google search results.";
  
  // Format URL cleanly like Google does
  let formattedUrl = url || "https://www.nikasrealtor.com/projects/example-project";
  let breadcrumb = "nikasrealtor.com > projects";
  try {
    const parsed = new URL(formattedUrl);
    breadcrumb = `${parsed.hostname} > ${parsed.pathname.split('/').filter(Boolean).join(' > ')}`;
  } catch (e) {
    // fallback
  }

  return (
    <Card className="bg-card border border-border/80 shadow-sm overflow-hidden">
      <div className="bg-muted/40 px-4 py-2 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-primary" />
          Google Search Result Live Preview
        </span>
        <span className="text-[11px] bg-background/80 px-2 py-0.5 rounded border border-border">Desktop & Mobile snippet</span>
      </div>
      <CardContent className="p-4 space-y-1.5 font-sans bg-background">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
            NR
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-[12px] font-medium leading-none">Nikas Realty</span>
            <span className="text-muted-foreground text-[11px] truncate max-w-md">{breadcrumb}</span>
          </div>
        </div>

        <div className="pt-0.5">
          <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] hover:underline text-[18px] leading-snug font-medium cursor-pointer line-clamp-1">
            {displayTitle}
          </h3>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {displayDesc}
        </p>
      </CardContent>
    </Card>
  );
};

export default SearchSnippetPreview;
