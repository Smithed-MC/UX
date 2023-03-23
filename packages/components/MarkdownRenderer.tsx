import Markdown, { MarkdownToJSX } from "markdown-to-jsx";

export const markdownOptions: MarkdownToJSX.Options = {
    overrides: {
        img: ({ children, ...props }) => (<img {...props} style={{ maxWidth: "100%" }}>{children}</img>),
        pre: ({ children, ...props }) => (<pre>{children.props.children}</pre>),
        p: ({children, ...props}) => (<p style={{fontSize: 18}} {...props}>{children}</p>)
    }, 
}

export default function MarkdownRenderer({children, ...props}: any) {
    return <Markdown options={markdownOptions} style={{ backgroundColor: 'var(--background)', padding: 16, borderRadius: 'var(--defaultBorderRadius)', fontSize: 18, ...props.style }} {...props}>
        {children}
    </Markdown>
}