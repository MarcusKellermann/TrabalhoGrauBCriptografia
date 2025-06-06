// Função para converter texto para binário ASCII
function textToBinary(text) {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join(' ');
}

// Função para converter binário ASCII para texto
function binaryToText(binStr) {
  return binStr.trim().split(' ').map(b => {
    return String.fromCharCode(parseInt(b, 2));
  }).join('');
}

// --- Método Repetition (3x) ---

// Codifica cada bit repetindo 3 vezes
function repetitionEncode(binStr) {
  let result = '';
  for (let bit of binStr) {
    if (bit === '0' || bit === '1') {
      result += bit.repeat(3);
    }
  }
  return result;
}

// Decodifica repetição
function repetitionDecode(binStr) {
  let result = '';
  for (let i = 0; i < binStr.length; i += 3) {
    const triplet = binStr.substr(i, 3);
    if (triplet.length < 3) break;
    const ones = triplet.split('').filter(b => b === '1').length;
    result += (ones >= 2) ? '1' : '0'; 
  }
  return result;
}

// --- Método Hamming (7,4) ---
// Baseado em codificação padrão para 4 bits de dados

// Calcula paridades e monta codeword 7 bits
function hammingEncode(dataBits) {
  if (dataBits.length !== 4) return null;
  const d = dataBits.split('').map(b => parseInt(b));
  // Posições: : p1 p2 d1 p3 d2 d3 d4
  const p1 = d[0] ^ d[1] ^ d[3];
  const p2 = d[0] ^ d[2] ^ d[3];
  const p3 = d[1] ^ d[2] ^ d[3];
  return `${p1}${p2}${d[0]}${p3}${d[1]}${d[2]}${d[3]}`;
}

// Corrige e decodifica código Hamming (7,4)
function hammingDecode(codeword) {
  if (codeword.length !== 7) return null;
  const bits = codeword.split('').map(b => parseInt(b));
  // Paridades
  const p1 = bits[0];
  const p2 = bits[1];
  const d1 = bits[2];
  const p3 = bits[3];
  const d2 = bits[4];
  const d3 = bits[5];
  const d4 = bits[6];
  // Síndromes
  const s1 = p1 ^ d1 ^ d2 ^ d4;
  const s2 = p2 ^ d1 ^ d3 ^ d4;
  const s3 = p3 ^ d2 ^ d3 ^ d4;
  const syndrome = s1 * 1 + s2 * 2 + s3 * 4; // posição do erro 
  if (syndrome !== 0) {
    // Corrige erro
    bits[syndrome - 1] = bits[syndrome - 1] ^ 1;
  }
  // Retorna bits de dados corrigidos
  return `${bits[2]}${bits[4]}${bits[5]}${bits[6]}`;
}


const CRC_POLY = '10011'; // x^4 + x + 1

function xor(a, b) {
  let result = '';
  for (let i = 1; i < b.length; i++) {
    result += a[i] === b[i] ? '0' : '1';
  }
  return result;
}

// Calcula CRC para um codeword binário (entrada como string de bits)
function crcEncode(data) {
  let appendedData = data + '0000'; // acrescenta zeros para grau 4
  let remainder = appendedData.substr(0, 5);

  for (let i = 5; i <= appendedData.length; i++) {
    if (remainder[0] === '1') {
      remainder = xor(CRC_POLY, remainder) + (i < appendedData.length ? appendedData[i] : '');
    } else {
      remainder = xor('00000', remainder) + (i < appendedData.length ? appendedData[i] : '');
    }
    remainder = remainder.substr(1);
  }
  return data + remainder;
}

// Verifica CRC - retorna true se correto
function crcCheck(codeword) {
  let remainder = codeword.substr(0, 5);

  for (let i = 5; i <= codeword.length; i++) {
    if (remainder[0] === '1') {
      remainder = xor(CRC_POLY, remainder) + (i < codeword.length ? codeword[i] : '');
    } else {
      remainder = xor('00000', remainder) + (i < codeword.length ? codeword[i] : '');
    }
    remainder = remainder.substr(1);
  }
  // Se o resto for zero, código está correto
  return !remainder.includes('1');
}

// --- Inserção de erro no código (inverte bit na posição dada, index 1-based) ---
function insertError(codeword, position) {
  if (!position || position < 1 || position > codeword.length) return codeword;
  const index = position - 1;
  let bits = codeword.split('');
  bits[index] = bits[index] === '0' ? '1' : '0';
  return bits.join('');
}

// --- Funções para manipular input e output ---

function encode() {
  const input = document.getElementById('inputText').value.trim();
  const method = document.getElementById('method').value;
  const errorPos = parseInt(document.getElementById('insertError').value);

  if (!input) {
    alert('Insira os símbolos para codificar.');
    return;
  }

  let output = '';

  if (method === 'repetition') {
    // Converte texto para binário e codifica
    const bin = textToBinary(input);
    let encoded = repetitionEncode(bin.replace(/ /g, ''));
    if (!isNaN(errorPos)) {
      encoded = insertError(encoded, errorPos);
    }
    output = `Codificado (repetition): ${encoded}`;
  } else if (method === 'hamming') {
    // Para simplificar, vamos codificar byte a byte (8 bits em blocos de 4 bits)
    const bin = textToBinary(input).replace(/ /g, '');
    let encodedArr = [];
    for (let i = 0; i < bin.length; i += 4) {
      const block = bin.substr(i, 4).padEnd(4, '0');
      const codeword = hammingEncode(block);
      encodedArr.push(codeword);
    }
    let encoded = encodedArr.join('');
    if (!isNaN(errorPos)) {
      encoded = insertError(encoded, errorPos);
    }
    output = `Codificado (repetition): ${encoded}`;
  } else if (method === 'crc') {
    // Para CRC, consideramos o input já em binário ou convertemos
    // Se input contém só 0 e 1, assumimos binário; senão convertemos
    const bin = /^[01]+$/.test(input) ? input : textToBinary(input).replace(/ /g, '');
    let encoded = crcEncode(bin);
    if (!isNaN(errorPos)) {
      encoded = insertError(encoded, errorPos);
    }
    output = `Entrada binária: ${bin}\nCodificado (CRC): ${encoded}`;
  }

  document.getElementById('output').textContent = output;
}

function decode() {
  const input = document.getElementById('inputText').value.trim();
  const method = document.getElementById('method').value;

  if (!input) {
    alert('Insira o codeword binário para decodificar.');
    return;
  }

  let output = '';

  if (method === 'repetition') {
    const decoded = repetitionDecode(input);
    // Converte binário para texto ASCII
    const grouped = decoded.match(/.{1,8}/g) || [];
    const text = grouped.map(b => String.fromCharCode(parseInt(b, 2))).join('');
    output = `Decodificado (repetition):\nTexto: ${text}`;
  } else if (method === 'hamming') {
    // Decodifica blocos de 7 bits
    let decodedArr = [];
    for (let i = 0; i < input.length; i += 7) {
      const block = input.substr(i, 7);
      if (block.length < 7) break;
      const decodedBits = hammingDecode(block);
      decodedArr.push(decodedBits);
    }
    const decodedBin = decodedArr.join('');
    const grouped = decodedBin.match(/.{1,8}/g) || [];
    const text = grouped.map(b => String.fromCharCode(parseInt(b, 2))).join('');
    output = `Decodificado (Hamming 7,4):\nTexto: ${text}`;
  } else if (method === 'crc') {
    // Verifica se o código está correto
    const isValid = crcCheck(input);
    output = isValid ? 'CRC válido - sem erros detectados.' : 'CRC inválido - erro detectado.';
  }

  document.getElementById('output').textContent = output;
}
