import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/utils";

export function ShareButtons({ path, title }: { path: string; title: string }) {
  const url = absoluteUrl(path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noreferrer"
        >
          Share on X
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}>Email</a>
      </Button>
    </div>
  );
}
