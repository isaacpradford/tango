export default function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
    if (textArea == null) {
        return;
    } else {
        textArea.style.height = "0",
        textArea.style.height = `${textArea.scrollHeight}px`
    }
}