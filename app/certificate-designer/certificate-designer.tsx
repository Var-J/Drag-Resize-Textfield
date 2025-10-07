import {useEffect, useRef, useState} from "react";
import {BoldIcon, ItalicIcon, UnderlineIcon,} from "@heroicons/react/24/outline";


export default function CertificateDesigner() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [items, setItems] = useState(
        Array.from({length: 5}, (_, i) => ({
            id: i,
            x: 50 + i * 100,
            y: 50 + i * 50,
            width: 160,
            height: 40,
            text: `Item ${i}`,
        }))
    );

    const updateItem = (
        id: number,
        updates: Partial<{ x: number; y: number; width: number; height: number; text: string }>
    ) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? {...item, ...updates} : item))
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
        updates: Partial<{
            x: number; y: number; width: number; height: number; text: string;
            fontWeight?: string | number;
            fontStyle?: string;
            textDecoration?: string;
            fontSize?: number;
            fontFamily?: string;
        }>
    ) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
    fontWeight?: string | number;
    fontStyle?: string;
    textDecoration?: string;
    fontSize?: number;
    fontFamily?: string;
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
                                    fontFamily,
                                    fontWeight,
                                    fontSize,
                                    textDecoration,
                                    fontStyle
                                }: DraggableResizableItemProps) {
    const itemRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const resizeCorner = useRef<"top-left" | "top-right" | "bottom-left" | "bottom-right" | null>(null);

    const dragStart = useRef({mouseX: 0, mouseY: 0, startX: 0, startY: 0});
    const resizeStart = useRef({mouseX: 0, mouseY: 0, startX: 0, startY: 0, startW: 0, startH: 0});

    const [isEditing, setIsEditing] = useState(false);
    const [isHoveringToolbar, setIsHoveringToolbar] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();

            if (isDragging.current) {
                const dx = e.clientX - dragStart.current.mouseX;
                const dy = e.clientY - dragStart.current.mouseY;
                let newX = dragStart.current.startX + dx;
                let newY = dragStart.current.startY + dy;

                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;
                if (newX + width > containerRect.width) newX = containerRect.width - width;
                if (newY + height > containerRect.height) newY = containerRect.height - height;

                onUpdate(id, {x: newX, y: newY});
            }

            if (isResizing.current && resizeCorner.current) {
                if (!containerRef.current) return;

                const containerRect = containerRef.current.getBoundingClientRect();
                const dx = e.clientX - resizeStart.current.mouseX;
                const dy = e.clientY - resizeStart.current.mouseY;

                let newWidth = resizeStart.current.startW;
                let newHeight = resizeStart.current.startH;
                let newX = resizeStart.current.startX;
                let newY = resizeStart.current.startY;

                switch (resizeCorner.current) {
                    case "top-left":
                        newWidth -= dx;
                        newHeight -= dy;
                        newX += dx;
                        newY += dy;
                        break;
                    case "top-right":
                        newWidth += dx;
                        newHeight -= dy;
                        newY += dy;
                        break;
                    case "bottom-left":
                        newWidth -= dx;
                        newHeight += dy;
                        newX += dx;
                        break;
                    case "bottom-right":
                        newWidth += dx;
                        newHeight += dy;
                        break;
                }

                // Clamp width and height so they don't exceed container bounds
                const maxWidth = containerRect.width - newX;
                const maxHeight = containerRect.height - newY;
                newWidth = Math.min(Math.max(newWidth, 20), maxWidth);
                newHeight = Math.min(Math.max(newHeight, 20), maxHeight);

                // Clamp X/Y so they stay inside container
                if (newX < 0) {
                    newWidth += newX; // shrink width if moving left out of bounds
                    newX = 0;
                }
                if (newY < 0) {
                    newHeight += newY; // shrink height if moving up out of bounds
                    newY = 0;
                }

                onUpdate(id, {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
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
    }, [id, onUpdate, containerRef, width, height]);

    const handleMouseDownDrag = (e: React.MouseEvent) => {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }
        if (!containerRef.current) return;

        isDragging.current = true;
        dragStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX: x,
            startY: y,
        };
        e.preventDefault();
    };

    const handleMouseDownResize = (
        e: React.MouseEvent,
        corner: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    ) => {
        isResizing.current = true;
        resizeCorner.current = corner;
        resizeStart.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX: x,
            startY: y,
            startW: width,
            startH: height,
        };
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <div ref={itemRef}
             onMouseDown={handleMouseDownDrag}
             style={{
                 left: x,
                 top: y,
             }}
             className={`${isEditing ? "bg-blue-300 shadow-blue-300 shadow-[0_0_15px_5px]" : ""} group absolute hover:shadow-[0_0_15px_5px] hover:bg-blue-300 hover:shadow-blue-300 select-none cursor-move p-1.5`}>
            <div
                style={{
                    width,
                    height,
                }}
                className="border relative flex justify-center items-center bg-black">
                <AutoResizeTextarea
                    value={text}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => !isHoveringToolbar && setIsEditing(false)}
                    onChange={(e) => onUpdate(id, {text: e.target.value})}
                    onMinHeightChange={(minH) => {
                        if (minH > height) {
                            onUpdate(id, {height: minH});
                        }
                    }}
                    style={{
                        fontWeight: fontWeight,
                        fontFamily: fontFamily,
                        textDecoration: textDecoration,
                        fontSize: fontSize,
                        fontStyle: fontStyle,
                    }}
                    className="w-full resize-none text-center break-words whitespace-pre-wrap outline-none bg-transparent"
                />
                {isEditing && (
                    <TextToolbar
                        fontWeight={fontWeight}
                        fontStyle={fontStyle}
                        textDecoration={textDecoration}
                        onMouseEnter={() => setIsHoveringToolbar(true)}
                        onMouseLeave={() => setIsHoveringToolbar(false)}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        onChange={(changes) => onUpdate(id, changes)}
                    />
                )}

                {/* Resize handles */}
                <div
                    className="absolute size-1 rounded-full bg-white cursor-nwse-resize"
                    style={{top: -2, left: -2}}
                    onMouseDown={(e) => handleMouseDownResize(e, "top-left")}
                />
                <div
                    className="absolute size-1 rounded-full bg-white cursor-nesw-resize"
                    style={{top: -2, right: -2}}
                    onMouseDown={(e) => handleMouseDownResize(e, "top-right")}
                />
                <div
                    className="absolute size-1 rounded-full bg-white cursor-nesw-resize"
                    style={{bottom: -2, left: -2}}
                    onMouseDown={(e) => handleMouseDownResize(e, "bottom-left")}
                />
                <div
                    className="absolute size-1 rounded-full bg-white cursor-nwse-resize"
                    style={{bottom: -2, right: -2}}
                    onMouseDown={(e) => handleMouseDownResize(e, "bottom-right")}
                />
            </div>
        </div>
    );
}

function AutoResizeTextarea({
                                value,
                                onChange,
                                onMinHeightChange,
                                isResizing,
                                ...props
                            }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    onMinHeightChange?: (height: number) => void;
    isResizing?: boolean;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current && !isResizing) {
            ref.current.style.height = "auto";
            const newHeight = ref.current.scrollHeight;
            ref.current.style.height = newHeight - 8 + "px"; // -8 for padding
            onMinHeightChange?.(newHeight);
        }
    }, [value, onMinHeightChange, isResizing]);

    return (
        <textarea
            {...props}
            ref={ref}
            value={value}
            onChange={onChange}
            style={props.style}
            className="resize-none overflow-hidden outline-none text-center w-full"
        />
    );
}

type TextToolbarProps = {
    fontWeight?: string | number;
    fontStyle?: string;
    textDecoration?: string;
    fontSize?: number;
    fontFamily?: string;
    onChange: (changes: Partial<TextToolbarState>) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

type TextToolbarState = {
    fontWeight?: string | number;
    fontStyle?: string;
    textDecoration?: string;
    fontSize?: number;
    fontFamily?: string;
};

const fonts = ["Arial", "Times New Roman", "Courier New", "Roboto", "Georgia"];

function TextToolbar({
                         fontWeight,
                         fontStyle,
                         textDecoration,
                         fontSize = 16,
                         fontFamily = "Arial",
                         onChange,
                         onMouseEnter,
                         onMouseLeave,
                     }: TextToolbarProps) {
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute z-50 flex -top-14 left-0 items-center space-x-2 rounded-lg bg-white shadow-lg border p-2 text-gray-800 transition-opacity duration-150"
        >
            {/* Bold */}
            <button
                className={`p-1.5 rounded hover:bg-gray-100 ${
                    fontWeight === "bold" ? "bg-gray-200" : ""
                }`}
                onClick={() =>
                    onChange({fontWeight: fontWeight === "bold" ? "normal" : "bold"})
                }
            >
                <BoldIcon className="w-4 h-4"/>
            </button>

            {/* Italic */}
            <button
                className={`p-1.5 rounded hover:bg-gray-100 ${
                    fontStyle === "italic" ? "bg-gray-200" : ""
                }`}
                onClick={() =>
                    onChange({fontStyle: fontStyle === "italic" ? "normal" : "italic"})
                }
            >
                <ItalicIcon className="w-4 h-4"/>
            </button>

            {/* Underline */}
            <button
                className={`p-1.5 rounded hover:bg-gray-100 ${
                    textDecoration === "underline" ? "bg-gray-200" : ""
                }`}
                onClick={() =>
                    onChange({
                        textDecoration:
                            textDecoration === "underline" ? "none" : "underline",
                    })
                }
            >
                <UnderlineIcon className="w-4 h-4"/>
            </button>

            {/* Font size */}
            <select
                value={fontSize}
                onChange={(e) => onChange({fontSize: parseInt(e.target.value)})}
                className="border rounded px-1 py-0.5 text-sm bg-white"
            >
                {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                    <option key={size} value={size}>
                        {size}px
                    </option>
                ))}
            </select>

            {/* Font family */}
            <select
                value={fontFamily}
                onChange={(e) => onChange({fontFamily: e.target.value})}
                className="border rounded px-1 py-0.5 text-sm bg-white"
            >
                {fonts.map((f) => (
                    <option key={f} value={f}>
                        {f}
                    </option>
                ))}
            </select>
        </div>
    );
}
