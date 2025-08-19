const express = require("express");
const bodyParser = require("body-parser");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Garantir que a pasta public exista
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Função para calcular o preço
function calcularPreco(categoria, quantidade) {
  let precoUnitario = 0;

  if (categoria === "Silk") {
    if (quantidade >= 200) precoUnitario = 12.20;
    else if (quantidade >= 100) precoUnitario = 12.90;
    else if (quantidade >= 50) precoUnitario = 14.90;
    else if (quantidade >= 31) precoUnitario = 17.50;
    else if (quantidade >= 10) precoUnitario = 20.50;
  } else if (categoria === "Transfer Digital") {
    if (quantidade >= 200) precoUnitario = 13.90;
    else if (quantidade >= 100) precoUnitario = 15.00;
    else if (quantidade >= 50) precoUnitario = 16.50;
    else if (quantidade >= 31) precoUnitario = 18.90;
    else if (quantidade >= 10) precoUnitario = 21.50;
  }

  return precoUnitario;
}

// Endpoint do webhook
app.post("/orcamento", (req, res) => {
  const {
    full_name,
    input_categorie,
    cor_sandalia,
    quantidade_produto,
    cpf_cnpj_input,
    endereco_cliente
  } = req.body;

  const quantidade = parseInt(quantidade_produto);
  const precoUnitario = calcularPreco(input_categorie, quantidade);
  const total = precoUnitario * quantidade;

  // Nome do arquivo PDF dentro da pasta public
  const fileName = `orcamento_${Date.now()}.pdf`;
  const filePath = path.join(publicDir, fileName);

  // Criar o PDF
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text("Orçamento - Sant Sandálias", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`👤 Nome: ${full_name}`);
  doc.text(`📦 Categoria: ${input_categorie}`);
  doc.text(`🎨 Cor: ${cor_sandalia}`);
  doc.text(`🔢 Quantidade: ${quantidade}`);
  doc.text(`🆔 CPF/CNPJ: ${cpf_cnpj_input}`);
  doc.text(`📍 Endereço: ${endereco_cliente}`);
  doc.moveDown();

  doc.text(`💰 Valor unitário: R$ ${precoUnitario.toFixed(2)}`);
  doc.text(`💵 Total: R$ ${total.toFixed(2)}`, { underline: true });

  doc.moveDown();
  doc.text("✅ Orçamento válido por 7 dias.", { align: "center" });

  doc.end();

  stream.on("finish", () => {
    res.json({
      success: true,
      message: "Orçamento gerado com sucesso!",
      // O Render vai servir a pasta public automaticamente
      link: `${req.protocol}://${req.get("host")}/${fileName}`
    });
  });
});

// Servir arquivos PDF da pasta public
app.use(express.static(publicDir));

// Subir servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
