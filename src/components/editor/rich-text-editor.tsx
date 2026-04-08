'use client';

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";

import { Button } from "@/components/ui/button";

export function RichTextEditor({
  initialContent,
  onChange,
}: {
  initialContent?: string;
  onChange: (value: { html: string; json: string }) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Build the story...",
      }),
      Image,
    ],
    content: initialContent || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange({
        html: editor.getHTML(),
        json: JSON.stringify(editor.getJSON()),
      });
    },
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-border/70 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Bullets
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

