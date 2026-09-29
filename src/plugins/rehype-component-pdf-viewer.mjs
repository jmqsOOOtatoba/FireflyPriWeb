/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a PDF Viewer component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.url - The URL of the PDF file.
 * @param {string} [properties.title] - Optional title for the PDF viewer.
 * @param {number} [properties.height] - Optional height in pixels (default: 600).
 * @param {import('mdast').RootContent[]} children - The children elements.
 * @returns {import('mdast').Parent} The created PDF Viewer component.
 */
export function PdfViewerComponent(properties, children) {
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("pdf" directive must be leaf type "::pdf{url="https://example.com/file.pdf"}")',
		]);

	if (!properties.url)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid URL. ("url" attribute is required)',
		);

	const url = properties.url;
	const title = properties.title || "PDF Viewer";
	const height = properties.height || 600;

	// 浏览器原生 PDF 预览（iframe 直接加载），不引入 pdf.js 重依赖
	return h("div", { class: "pdf-container" }, [
		h("div", { class: "pdf-header" }, [
			h("div", { class: "pdf-title" }, title),
			h(
				"a",
				{
					class: "pdf-download",
					href: url,
					target: "_blank",
					download: "",
				},
				"下载PDF",
			),
		]),
		h("div", { class: "pdf-viewer-wrapper" }, [
			h("iframe", {
				class: "pdf-viewer",
				src: url,
				style: `height: ${height}px;`,
				title: title,
			}),
		]),
	]);
}
