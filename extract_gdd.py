import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = []
            for p in tree.iterfind('.//w:p', namespaces):
                p_text = ''.join(node.text for node in p.iterfind('.//w:t', namespaces) if node.text)
                if p_text:
                    text.append(p_text)
            return '\n'.join(text)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    content = extract_text('OVERDRIVE_Game_Design_Document_Phase_1.docx')
    with open('GDD_extracted.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Extraction complete.")
