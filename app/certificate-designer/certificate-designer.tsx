import { useState, useRef, useEffect } from "react";

export default function CertificateDesigner() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [items, setItems] = useState(
        Array.from({ length: 5 }, (_, i) => ({
            id: i,
            x: 50 + Math.random() * 800,
            y: 50 + Math.random() * 200,
            width: 160,
            height: 40,
            text: `Item ${i}`, // added text field
        }))
    );

    const updateItem = (
        id: number,
        updates: Partial<{ x: number; y: number; width: number; height: number; text: string }>
    ) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
    };

    return (
        <div className="flex flex-col justify-center items-center space-y-10 h-screen">
            <h1 className="text-4xl">Certificate Designer</h1>

            <div
                ref={containerRef}
                className="w-3/4 h-1/2 border relative overflow-hidden"
            >
                {items.map((item) => (
                    <DraggableResizableItem
                        key={item.id}
                        {...item}
                        onUpdate={updateItem}
                        containerRef={containerRef}
                    />
                ))}
            </div>
        </div>
    );
}

type DraggableResizableItemProps = {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    onUpdate: (
        id: number,
        updates: Partial<{ x: number; y: number; width: number; height: number; text: string }>
    ) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
};

function DraggableResizableItem({
                                    id,
                                    x,
                                    y,
                                    width,
                                    height,
                                    text,
                                    onUpdate,
                                    containerRef,
                                }: DraggableResizableItemProps) {
    const itemRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const resizeCorner = useRef<"top-left" | "top-right" | "bottom-left" | "bottom-right" | null>(null);
    const offset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();

            if (isDragging.current) {
                let newX = e.clientX - containerRect.left - offset.current.x;
                let newY = e.clientY - containerRect.top - offset.current.y;

                if (newX < 0) {
                    newX = 0;
                }

                if (newY < 0) {
                    newY = 0;
                }

                if (newX + width > containerRect.width) {
                    newX = containerRect.width - width;
                }

                if (newY + height > containerRect.height) {
                    newY = containerRect.height - height;
                }

                onUpdate(id, { x: newX, y: newY });
            }

            if (isResizing.current && resizeCorner.current) {
                let newWidth = width;
                let newHeight = height;
                let newX = x;
                let newY = y;

                const mouseX = e.clientX - containerRect.left;
                const mouseY = e.clientY - containerRect.top;

                switch (resizeCorner.current) {
                    case "top-left":
                        newWidth = width + (x - mouseX);
                        newHeight = height + (y - mouseY);
                        newX = mouseX;
                        newY = mouseY;
                        break;
                    case "top-right":
                        newWidth = mouseX - x;
                        newHeight = height + (y - mouseY);
                        newY = mouseY;
                        break;
                    case "bottom-left":
                        newWidth = width + (x - mouseX);
                        newHeight = mouseY - y;
                        newX = mouseX;
                        break;
                    case "bottom-right":
                        newWidth = mouseX - x;
                        newHeight = mouseY - y;
                        break;
                }

                onUpdate(id, {
                    x: newX,
                    y: newY,
                    width: Math.max(newWidth, 20),
                    height: Math.max(newHeight, 20),
                });
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            isResizing.current = false;
            resizeCorner.current = null;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [id, onUpdate, x, y, width, height, containerRef]);

    const handleMouseDownDrag = (e: React.MouseEvent) => {
        // Don't start dragging if the click is on an input/textarea
        if (
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLInputElement
        ) {
            return;
        }

        const rect = itemRef.current?.getBoundingClientRect();
        if (!rect || !containerRef.current) return;

        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        isDragging.current = true;
        e.preventDefault();
    };

    const handleMouseDownResize = (
        e: React.MouseEvent,
        corner: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    ) => {
        isResizing.current = true;
        resizeCorner.current = corner;
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <div
            ref={itemRef}
            className="border absolute flex justify-center items-center select-none p-2 cursor-move overflow-hidden"
            style={{ left: x, top: y, width, height }}
            onMouseDown={handleMouseDownDrag}
        >
            <AutoResizeTextarea
                defaultValue={text}
                onChange={(e) => onUpdate(id, { text: e.target.value })}
                className="w-full h-full resize-none text-center break-words whitespace-pre-wrap outline-none bg-transparent"
            />

            {/* Resize handles */}
            <div
                className="absolute size-1 rounded-full bg-white cursor-nwse-resize"
                style={{ top: -2, left: -2 }}
                onMouseDown={(e) => handleMouseDownResize(e, "top-left")}
            />
            <div
                className="absolute size-1 rounded-full bg-white cursor-nesw-resize"
                style={{ top: -2, right: -2 }}
                onMouseDown={(e) => handleMouseDownResize(e, "top-right")}
            />
            <div
                className="absolute size-1 rounded-full bg-white cursor-nesw-resize"
                style={{ bottom: -2, left: -2 }}
                onMouseDown={(e) => handleMouseDownResize(e, "bottom-left")}
            />
            <div
                className="absolute size-1 rounded-full bg-white cursor-nwse-resize"
                style={{ bottom: -2, right: -2 }}
                onMouseDown={(e) => handleMouseDownResize(e, "bottom-right")}
            />
        </div>
    );
}

function AutoResizeTextarea({
                                value,
                                onChange,
                                ...props
                            }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = "auto"; // Reset height to measure again
            ref.current.style.height = ref.current.scrollHeight + "px";
        }
    }, [value]);

    return (
        <textarea
            {...props}
            ref={ref}
            value={value}
            onChange={onChange}
            className="resize-none overflow-hidden outline-none text-center w-full"
        />
    );
}
