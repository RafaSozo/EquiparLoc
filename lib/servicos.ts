/** Serviços oferecidos (mesma lista do menu "Serviços"). */
export interface Servico {
  id: string;
  nome: string;
  resumo: string;
  paragrafos: string[];
  itens: string[];
  imagem: string;
  imagemAlt: string;
  /** O que o cliente deve informar no pedido de orçamento */
  informe: string;
}

export const SERVICOS: Servico[] = [
  {
    id: 'terraplenagem',
    nome: 'Terraplenagem',
    resumo: 'Escavação, nivelamento, aterro e abertura de valas com máquina e operador.',
    paragrafos: [
      'Preparamos o terreno da sua obra com escavação, corte, aterro, nivelamento e abertura de valas para fundações e redes.',
      'Usamos miniescavadeira, minicarregadeira e retroescavadeira da nossa frota, com operador, o que permite trabalhar também em lotes e espaços apertados.',
    ],
    itens: [
      'Escavação para fundações e subsolos',
      'Abertura de valas para redes de água, esgoto e elétrica',
      'Nivelamento, corte e aterro de terreno',
      'Limpeza de terreno e remoção de entulho',
    ],
    imagem: '/images/hero/hero-obra-escavadeira-betoneira.jpg',
    imagemAlt: 'Escavadeira trabalhando em terreno de obra',
    informe: 'Informe o tamanho da área, o tipo de solo e o que precisa ser feito.',
  },
];
