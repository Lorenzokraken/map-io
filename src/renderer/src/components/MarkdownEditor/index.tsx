import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import './style.css'; // We'll create this style file later
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface MarkdownEditorProps {
  nodeId: string;
  onClose: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ nodeId, onClose }) => {
  const { state, updateNodeData } = useContext(AppContext);
  const currentGraph = state.graphs[state.currentGraphId];
  const selectedNode = currentGraph?.nodes.find((node) => node.id === nodeId);
  const [markdown, setMarkdown] = useState(selectedNode?.data.markdownContent || '');

  useEffect(() => {
    // Update local markdown state if the node's content changes externally
    setMarkdown(selectedNode?.data.markdownContent || '');
  }, [selectedNode?.data.markdownContent]);

  const handleSave = () => {
    if (nodeId) {
      updateNodeData(nodeId, { markdownContent: markdown });
    }
    onClose();
  };

  return (
    <div className="markdown-editor-overlay">
      <div className="markdown-editor-content">
        <h3>Edit Markdown for {selectedNode?.data.title}</h3>
        <ReactQuill
          theme="snow"
          value={markdown}
          onChange={setMarkdown}
          className="markdown-textarea"
          modules={{
            toolbar: [
              [{ 'header': [1, 2, false] }],
              ['bold', 'italic', 'underline', 'strike', 'blockquote'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
              ['link', 'image'],
              ['clean']
            ],
          }}
        />
        <div className="markdown-editor-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;