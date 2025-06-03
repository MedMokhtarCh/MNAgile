
export const parseCahierContentToHTML = (content, project, isTruncated) => {
  if (!content || !project) {
    return `
      <h1>Cahier des Charges</h1>
      <div class="subtitle">Projet : ${project.title || 'Projet sans titre'}</div>
      <p>Erreur : Impossible de générer le cahier des charges. Veuillez réessayer.</p>
    `;
  }

  let htmlOutput = '';
  let isListOpen = false;
  let inSectionDiv = false;
  let inTable = false;
  let tableHeaderParsed = false;

  const lines = content.split('\n');

  lines.forEach((originalLine, index) => {
    const line = originalLine.trim();

    if (!line) {
      if (isListOpen) {
        htmlOutput += '</ul>';
        isListOpen = false;
      }
      if (inTable) {
        htmlOutput += '</tbody></table>';
        inTable = false;
        tableHeaderParsed = false;
      }
      return;
    }

    if (line.startsWith('# ')) {
      if (isListOpen) { htmlOutput += '</ul>'; isListOpen = false; }
      if (inSectionDiv) { htmlOutput += '</div>'; inSectionDiv = false; }
      if (inTable) { htmlOutput += '</tbody></table>'; inTable = false; tableHeaderParsed = false; }
      htmlOutput += `<h1>${line.substring(1).trim()}</h1>`;
      return;
    }

    if (line.startsWith('## ')) {
      if (isListOpen) { htmlOutput += '</ul>'; isListOpen = false; }
      if (inSectionDiv) { htmlOutput += '</div>'; inSectionDiv = false; }
      if (inTable) { htmlOutput += '</tbody></table>'; inTable = false; tableHeaderParsed = false; }
      htmlOutput += `<h2>${line.substring(2).trim()}</h2>`;
      return;
    }

    if (line.startsWith('### ')) {
      if (isListOpen) { htmlOutput += '</ul>'; isListOpen = false; }
      if (inTable) { htmlOutput += '</tbody></table>'; inTable = false; tableHeaderParsed = false; }
      htmlOutput += `<h3>${line.substring(3).trim()}</h3>`;
      return;
    }

    const mainSectionMatch = line.match(/^(\d+\.\s.*)$/);
    if (mainSectionMatch) {
      if (isListOpen) { htmlOutput += '</ul>'; isListOpen = false; }
      if (inSectionDiv) { htmlOutput += '</div>'; }
      if (inTable) { htmlOutput += '</tbody></table>'; inTable = false; tableHeaderParsed = false; }
      htmlOutput += `<div class="section"><h2 class="section-title">${mainSectionMatch[1]}</h2>`;
      inSectionDiv = true;
      return;
    }

    const subSectionMatch = line.match(/^(\d+\.\d+\.\s.*)$/);
    if (subSectionMatch) {
      if (isListOpen) { htmlOutput += '</ul>'; isListOpen = false; }
      if (inTable) { htmlOutput += '</tbody></table>'; inTable = false; tableHeaderParsed = false; }
      htmlOutput += `<h3>${subSectionMatch[1]}</h3>`;
      return;
    }

    const listItemMatch = line.match(/^[*-]\s*(.*)$/);
    if (listItemMatch) {
      if (inTable) { htmlOutput += '</tbody></table>'; inTable = false; tableHeaderParsed = false; }
      if (!isListOpen) { htmlOutput += '<ul>'; isListOpen = true; }
      const listItemText = listItemMatch[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlOutput += `<li>${listItemText}</li>`;
      return;
    }

    if (line.startsWith('|') && line.includes('|')) {
      const nextLine = lines[index + 1] ? lines[index + 1].trim() : '';
      if (nextLine.startsWith('|') && nextLine.includes('---')) {
        if (isListOpen) { htmlOutput += '</ul>'; isListOpen = false; }
        if (inTable) { htmlOutput += '</tbody></table>'; }
        htmlOutput += '<table><thead><tr>';
        line.split('|').forEach((cell, i) => {
          if (i > 0 && i < line.split('|').length - 1) {
            htmlOutput += `<th>${cell.trim()}</th>`;
          }
        });
        htmlOutput += '</tr></thead><tbody>';
        inTable = true;
        tableHeaderParsed = true;
        lines[index + 1] = '';
        return;
      } else if (inTable || tableHeaderParsed) {
        htmlOutput += '<tr>';
        line.split('|').forEach((cell, i) => {
          if (i > 0 && i < line.split('|').length - 1) {
            htmlOutput += `<td>${cell.trim()}</td>`;
          }
        });
        htmlOutput += '</tr>';
        return;
      }
    }

    let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    if (isListOpen) {
      htmlOutput += '</ul>';
      isListOpen = false;
    }
    if (inTable && !line.startsWith('|')) {
      htmlOutput += '</tbody></table>';
      inTable = false;
      tableHeaderParsed = false;
    }

    if (processedLine.includes('Date de création :') || processedLine.includes('Version ') || processedLine.includes('Date de début :') || processedLine.includes('Date de fin :') || processedLine.includes('Public Cible :')) {
      htmlOutput += `<p class="subtitle-info">${processedLine}</p>`;
    } else {
      htmlOutput += `<p>${processedLine}</p>`;
    }
  });

  if (isListOpen) {
    htmlOutput += '</ul>';
  }
  if (inSectionDiv) {
    htmlOutput += '</div>';
  }
  if (inTable) {
    htmlOutput += '</tbody></table>';
  }

  if (isTruncated) {
    htmlOutput += `
      <div class="warning">
        Attention : Le contenu généré est incomplet en raison d'une limitation de longueur de réponse de l'API. Certaines sections peuvent être absentes ou tronquées.
      </div>
    `;
  }

  htmlOutput += `
    <div class="footer">
      📋 Généré le ${new Date().toLocaleDateString('fr-FR')} • Version 1.0 • Cahier des charges automatisé
    </div>
  `;

  return htmlOutput;
};

export const downloadCahierDesCharges = (cahierContent, project) => {
  if (!cahierContent || !project) return;

  const fullHtmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cahier des Charges - ${project.title || 'Projet sans titre'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            margin: 40px;
            color: #333;
            background: #f8f9ff;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1976d2;
            text-align: center;
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .subtitle {
            text-align: center;
            font-style: italic;
            color: #666;
            font-size: 18px;
            margin-bottom: 40px;
            padding: 20px;
            background: rgba(25, 118, 210, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(25, 118, 210, 0.1);
        }
        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e8eaf6;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        h2, .section-title {
            color: #1976d2;
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e3f2fd;
        }
        h3 {
            color: #1565c0;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            margin-top: 20px;
        }
        p {
            margin-bottom: 15px;
            font-size: 15px;
            text-align: justify;
        }
        ul {
            padding-left: 25px;
            margin-bottom: 15px;
        }
        li {
            margin-bottom: 5px;
            font-size: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 25px;
            background: linear-gradient(135deg, #f5f5f5, #e8eaf6);
            border-radius: 12px;
            font-size: 14px;
            color: #666;
            font-style: italic;
            border: 1px solid #e0e0e0;
        }
        .warning {
            color: #d32f2f;
            font-style: italic;
            margin-top: 20px;
            padding: 20px;
            background: rgba(211, 47, 47, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(211, 47, 47, 0.2);
        }
        .subtitle-info {
            text-align: center;
            font-style: italic;
            color: #555;
            font-size: 16px;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        @media print {
            body { margin: 0; background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        ${cahierContent}
    </div>
</body>
</html>`;

  try {
    const blob = new Blob([fullHtmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedTitle = (project.title || 'Projet_sans_titre').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `Cahier_des_charges_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erreur lors du téléchargement:', err);
    throw new Error('Échec du téléchargement du cahier des charges.');
  }
};