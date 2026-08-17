using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data.Seed
{
    /// <summary>
    /// Populates the default DocumentTemplate row for each <see cref="DocumentTemplateType"/> the
    /// first time the application runs against a database that doesn't have them yet. The Quote,
    /// Contract and ServiceOrder templates reproduce, as HTML, the same layout currently hardcoded
    /// in the Angular document builders (quote-documents.ts / order-documents.ts) so PDF generation
    /// keeps working exactly as before while becoming admin-editable. SalesOrder is a new, basic
    /// template, since Serodio doesn't have one yet.
    ///
    /// Two kinds of placeholder appear in Content: simple scalar tokens (e.g. {{ClientName}}),
    /// substituted with a single value at generation time, and named block tokens (e.g.
    /// {{ProductRows}}, {{SignatureBlock}}), substituted with a whole HTML fragment still built in
    /// code from the record's data - this keeps totals/signatures/tables safe from a malformed
    /// upload, since only the surrounding static text is actually admin-editable. Contract has
    /// multiple printed pages; they are joined with the literal marker "&lt;!-- PAGE_BREAK --&gt;".
    /// This seeder only ever inserts - it never overwrites a template an Admin has already edited.
    /// </summary>
    public static class DocumentTemplateSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider;
            var logger = provider.GetService<ILoggerFactory>()?.CreateLogger("DocumentTemplateSeeder");

            try
            {
                var context = provider.GetRequiredService<MyDBContextEF>();

                foreach (var (type, name, fileName, content) in BuildDefaultTemplates())
                {
                    var alreadyExists = await context.DocumentTemplate.AnyAsync(d => d.Type == type);
                    if (alreadyExists)
                    {
                        continue;
                    }

                    await context.DocumentTemplate.AddAsync(
                        new DocumentTemplate
                        {
                            Type = type,
                            Name = name,
                            FileName = fileName,
                            Content = content,
                        }
                    );
                    logger?.LogInformation("DocumentTemplateSeeder: created default template for {Type}", type);
                }

                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "An error occurred while seeding the default document templates.");
            }
        }

        private static (
            DocumentTemplateType Type,
            string Name,
            string FileName,
            string Content
        )[] BuildDefaultTemplates()
        {
            return
            [
                (DocumentTemplateType.Quote, "Orçamento", "orcamento.html", QuoteTemplate),
                (DocumentTemplateType.Contract, "Contrato de Fretamento", "contrato.html", ContractTemplate),
                (DocumentTemplateType.ServiceOrder, "Ordem de Serviço", "ordem-de-servico.html", ServiceOrderTemplate),
                (DocumentTemplateType.SalesOrder, "Pedido de Venda", "pedido-de-venda.html", SalesOrderTemplate),
            ];
        }

        private const string QuoteTemplate = """
            <h1>ORÇAMENTO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE</h1>
            <p class="doc-number">N°. {{QuoteNumber}}</p>
            <table>
              <tbody>
                <tr><td style="width:30%"><b>CLIENTE</b></td><td>{{ClientName}}</td></tr>
                <tr><td><b>CNPJ/CPF</b></td><td>{{ClientDocument}}</td></tr>
                <tr><td><b>ENDEREÇO</b></td><td>{{ClientAddress}}</td></tr>
                <tr><td><b>DATA</b></td><td>{{QuoteDate}}</td></tr>
              </tbody>
            </table>

            <h2>Itens Orçados</h2>
            <table>
              <thead>
                <tr><th>Descrição</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Total</th></tr>
              </thead>
              <tbody>{{ProductRows}}</tbody>
            </table>
            <table>
              <tbody>
                <tr><td style="width:70%"><b>Valor Total</b></td><td>{{TotalPrice}}</td></tr>
                <tr><td><b>Condição de Pagamento</b></td><td>{{PaymentCondition}}</td></tr>
                <tr><td><b>Forma de Pagamento</b></td><td>{{PaymentMethod}}</td></tr>
              </tbody>
            </table>

            <h2>Condições Gerais</h2>
            <p>1. Este orçamento tem validade de 10 (dez) dias corridos a partir da data de emissão.</p>
            <p>2. Os valores apresentados poderão sofrer alterações em caso de mudança de roteiro,
              quilometragem, datas ou quantidade de passageiros informados na solicitação.</p>
            <p>3. A confirmação do serviço está sujeita à disponibilidade de veículo e motorista na data
              solicitada, e será formalizada mediante assinatura de contrato e pagamento do sinal.</p>
            <p>4. Despesas com pedágio, estacionamento, hospedagem e alimentação do(s) motorista(s), quando
              aplicável, não estão incluídas neste orçamento, salvo indicação em contrário.</p>
            <p>5. Cancelamentos e alterações seguem as condições descritas no contrato de prestação de
              serviços firmado no momento da confirmação.</p>
            <p>6. Dúvidas e informações adicionais podem ser tratadas diretamente com
              {{CompanyContactName}}, pelo telefone {{CompanyWhatsapp}}.</p>

            {{SignatureBlock}}
            """;

        private const string ContractTemplate = """
            <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE<br/>DE PASSAGEIROS SOB O REGIME DE FRETAMENTO EVENTUAL</h1>
            <p class="doc-number">N°. {{TripNumber}}</p>
            <p>
              As partes, de um lado <b>{{CompanyLegalName}}</b>, pessoa jurídica de direito privado,
              inscrita no CNPJ sob o nº <b>{{CompanyCnpj}}</b>, com sede na
              <b>{{CompanyAddress}}</b>, por seu representante infra-assinado, doravante
              denominada <b>CONTRATADA</b>, e de outro lado <b>{{ContratanteName}}</b>, CNPJ/CPF nº
              <b>{{ContratanteDocument}}</b>, endereço <b>{{ContratanteAddress}}</b>, doravante denominado
              <b>CONTRATANTE</b>, resolvem celebrar o presente Contrato de Prestação de Serviços de
              Transporte de Passageiros sob o Regime de Fretamento Eventual, o qual será regido pelas
              cláusulas e condições a seguir estabelecidas:
            </p>
            <p><span class="clause-title">Cláusula Primeira.</span> A CONTRATADA prestará à CONTRATANTE
              serviço de transporte de passageiros, sob o regime de fretamento eventual, a ser realizado em
              ônibus de acordo com as características, horários e itinerários descritos no ANEXO I, o qual
              passa a fazer parte integrante deste instrumento.</p>
            <p><span class="clause-title">Parágrafo Único.</span> A finalidade da viagem é: TURISMO</p>
            <p><span class="clause-title">Cláusula Segunda.</span> Pela presente prestação de serviços de
              fretamento eventual ora contratado, a CONTRATANTE pagará à CONTRATADA a importância de
              <b>{{TotalPrice}}</b>, com limite de até <b>{{LimiteKm}}</b>.</p>
            <p><span class="clause-title">Parágrafo Primeiro.</span> A importância descrita no caput desta
              cláusula será quitada conforme descrito no ANEXO I ao final deste contrato.</p>
            <p><span class="clause-title">Parágrafo Segundo.</span> Se a viagem exceder a quilometragem
              estabelecida no caput, além do valor acima estipulado, será cobrado <b>{{KmExcedente}}</b> por
              quilômetro excedido, o que será aferido ao final da viagem, sendo que essa diferença, se
              houver, deverá ser quitada no prazo de 15 dias, contados do término da viagem, mediante o
              pagamento do respectivo boleto bancário.</p>
            <p><span class="clause-title">Parágrafo Terceiro.</span> Se a duração da viagem ultrapassar o
              limite de dias previstos neste contrato, por culpa (negligência, imprudência ou imperícia) da
              CONTRATANTE ou ocorrência de fato que não se enquadre em motivos de CASO FORTUITO E FORÇA
              MAIOR nos termos do art. 393 do Código Civil Brasileiro, ficará a CONTRATANTE obrigada ao
              pagamento de diárias extras no valor de <b>{{DiariaExtra}}</b>.</p>
            <p><span class="clause-title">Parágrafo Quarto.</span> A parte CONTRATANTE não poderá alegar a
              exceção prevista nos termos do art. 393 do Código Civil Brasileiro em relação a cobrança de
              diárias extras quando no momento da negociação comercial for exposto os riscos inerentes a
              viagem que deverão estar especificados no ANEXO I do presente instrumento.</p>
            <p><span class="clause-title">Parágrafo Quinto.</span> O pagamento fora dos prazos estabelecidos
              nos parágrafos anteriores acarretará a aplicação de correção monetária com base no INPC-IBGE,
              juros moratórios de 1% (um por cento) ao mês, e multa de 2% (dois por cento) sobre o valor
              inadimplido, até a data do efetivo pagamento.</p>
            <p><span class="clause-title">Parágrafo Sexto.</span> Fica neste ato ciente a CONTRATANTE que
              para a constituição da presente contratação necessário se faz o pagamento integral, antes de
              seu vencimento, do valor descrito no ANEXO I a título de entrada, sob pena de ser
              caracterizado cancelamento e/ou rescisão do presente contrato, motivado pela CONTRATANTE.</p>
            <!-- PAGE_BREAK -->
            <p><span class="clause-title">Parágrafo Sétimo.</span> A nota fiscal será emitida uma semana
              antes da viagem requerida pela parte CONTRATANTE. No caso de desistência, cancelamento e/ou
              rescisão de contrato a pedido da CONTRATANTE, e já havendo sido emitida a Nota Fiscal, ficará
              a cargo da CONTRATANTE o pagamento devido dos impostos inerentes da emissão de tal Nota, como
              PIS - 0,65%, COFINS 3%, IRPJ/CSLL - 34% sobre o lucro líquido (receita/custo e despesa) e
              ICMS.</p>
            <p><span class="clause-title">Cláusula Terceira.</span> Independentemente do valor estipulado na
              Cláusula Segunda, ficarão a cargo da CONTRATANTE as despesas com alimentação do(s)
              motorista(s), bem como a cargo da CONTRATANTE as despesas com hospedagem do(s) motorista(s), e
              por fim por conta da CONTRATANTE as taxas turísticas e despesas com estacionamento.</p>
            <p><span class="clause-title">Cláusula Quarta.</span> A CONTRATANTE obriga-se a:</p>
            <p>
              a) Nomear uma pessoa para ser responsável pela viagem durante a execução do serviço, a qual
              compromete-se a zelar pelo bom andamento da viagem;<br/>
              b) Fornecer listagem constando todos os dados exigidos pelos órgãos regulamentadores com 7
              dias de antecedência a data da viagem;<br/>
              c) Reunir todos os passageiros nos locais e horários estabelecidos;<br/>
              d) Respeitar todas as normas relativas à viagem estabelecidas pela CONTRATADA;<br/>
              e) Não transportar passageiros em número superior à capacidade do ônibus;<br/>
              f) Não usar o veículo para outras finalidades que não a de transporte de passageiros;<br/>
              g) Obter os alvarás e autorizações necessárias;<br/>
              h) Arcar com taxas turísticas;<br/>
              i) Comunicar, por escrito, qualquer alteração de veículo, data, horário e/ou endereço no
              mínimo 20 dias antes da data da viagem, sendo que tais alterações serão avaliadas conforme
              disponibilidade da CONTRATADA podendo haver alterações no preço ora ajustado;<br/>
              j) Reparar todos os danos e extravios ocorridos no veículo, causados pela CONTRATANTE e/ou por
              passageiros.
            </p>
            <p><span class="clause-title">Cláusula Quinta.</span> A CONTRATADA obriga-se a:</p>
            <p>
              a) Fornecer o ônibus em conformidade com o ANEXO I deste instrumento, atendendo todas as
              exigências de ordem legal;<br/>
              b) Arcar com todas as despesas de mão-de-obra, combustível, lubrificantes, peças e
              manutenção, necessários a execução dos serviços objeto deste instrumento;<br/>
              c) Manter seguro obrigatório de danos pessoais, previsto no Código Nacional de Trânsito;<br/>
              d) Substituir imediatamente os ônibus que não apresentarem condições de transporte, por avaria
              mecânica ou qualquer outro motivo, onde quer que estes se encontrem, prosseguindo na condução
              das pessoas transportadas;<br/>
              e) Fornecer condutores devidamente capacitados e habilitados que observem rigorosamente as
              disposições legais e regulamentares no que se refere à condução do ônibus, bem como trajados e
              identificados, e em condições de higiene pessoal;<br/>
              f) Responsabilizar-se pelo registro e habilitação dos seus contratados para o serviço,
              respondendo exclusivamente por ônus e encargos decorrentes dos contratos de trabalho, por toda
              e qualquer ação trabalhista e/ou indenizatória, bem como por eventuais autuações/multas por
              parte de órgãos fiscalizadores.
            </p>
            <p><span class="clause-title">Cláusula Sexta.</span> A CONTRATANTE receberá o veículo em
              condições normais de funcionamento, devendo vistoriá-lo no ato da sua apresentação não cabendo
              qualquer reclamação posterior.</p>
            <!-- PAGE_BREAK -->
            <p><span class="clause-title">Cláusula Sétima.</span> Não será realizado o transporte em
              estradas não pavimentadas, estradas de chão, pedra, cascalho ou em qualquer outro trajeto da
              mesma natureza.</p>
            <p><span class="clause-title">Cláusula Oitava.</span> A CONTRATADA não se responsabilizará pela
              ausência da CONTRATANTE e seus passageiros nos locais de embarque nos horários
              estabelecidos.</p>
            <p><span class="clause-title">Cláusula Nona.</span> Os passageiros transportados durante a
              referida prestação de serviços estarão cobertos por seguro de responsabilidade civil contra
              acidentes pessoais, conforme a regulamentação de transporte rodoviário de passageiros
              aplicável.</p>
            <p><span class="clause-title">Cláusula Décima.</span> O descumprimento a qualquer cláusula do
              presente instrumento acarretará sua rescisão de pleno direito, sendo aplicada à parte
              infratora multa de 10% (dez por cento) do valor total do presente contrato, que será revertida
              em favor da parte inocente, sendo que, no caso de cancelamento da viagem por parte da
              CONTRATANTE serão aplicadas as disposições da Cláusula Décima Primeira deste instrumento.</p>
            <p><span class="clause-title">Cláusula Décima Primeira.</span> Em caso de cancelamento da viagem
              por parte da CONTRATANTE, esta ficará obrigada ao pagamento de multa correspondente a 30% do
              valor contratado, sendo que os valores já pagos pela CONTRATANTE serão compensados para
              apuração e pagamento da multa.</p>
            <p><span class="clause-title">Cláusula Décima Segunda.</span> Este contrato não estabelece
              vínculo de qualquer natureza nem envolve responsabilidade solidária e/ou subsidiária entre as
              partes, bem como seus funcionários ou prepostos, sujeitando-se apenas ao pactuado neste
              instrumento.</p>
            <p><span class="clause-title">Cláusula Décima Terceira.</span> Qualquer tolerância ou omissão em
              exigir o estrito cumprimento de quaisquer das Cláusulas ou condições deste contrato, ou
              exercer direito delas decorrentes, não constituirá renúncia às mesmas, e não prejudicará a
              faculdade das partes em exigi-las ou exercê-los a qualquer tempo.</p>
            <p><span class="clause-title">Cláusula Décima Quarta.</span> Elegem as partes, de comum acordo,
              o Foro da Comarca de Guarulhos - SP, para dirimir quaisquer questões oriundas do presente
              Instrumento, renunciando a qualquer outro por mais privilegiado que seja.</p>
            <p><span class="clause-title">Cláusula Décima Quinta.</span> Quando fornecido o Kit Conforto, em
              caso de extravio, será cobrado da CONTRATANTE o valor de R$ 75,00 a manta (unidade) e R$ 25,00
              o travesseiro (unidade).</p>
            <p style="margin-top: 16px;">E por estarem assim justos e contratados, as partes firmam o
              presente em 2 (duas) vias de igual teor e forma, bem como assinam o presente instrumento as
              testemunhas abaixo.</p>
            <!-- PAGE_BREAK -->
            <h2>ANEXO I - Roteiro, Veículo e Condições de Pagamento</h2>
            <table>
              <thead>
                <tr><th>Nº</th><th>Origem</th><th>Destino</th><th>Saída</th><th>Distância</th></tr>
              </thead>
              <tbody>{{LegRows}}</tbody>
            </table>
            <p><b>Veículo:</b> {{VehicleInfo}}</p>
            <p><b>Data da viagem:</b> {{TripDate}}</p>
            <table>
              <thead>
                <tr><th>Descrição</th><th>Valor</th></tr>
              </thead>
              <tbody>
                <tr><td>Sinal (20%)</td><td>{{Sinal}}</td></tr>
                <tr><td>Saldo (80%)</td><td>{{Saldo}}</td></tr>
                <tr><td><b>Valor total</b></td><td><b>{{TotalPrice}}</b></td></tr>
              </tbody>
            </table>
            <p style="margin-top: 10px;">Forma de pagamento: conforme combinado com a CONTRATADA.</p>

            {{SignatureBlock}}
            """;

        private const string ServiceOrderTemplate = """
            <h1>ORDEM DE SERVIÇO</h1>
            <p class="doc-number">Viagem {{TripNumber}}</p>
            <table>
              <tbody>
                <tr><td><b>MOTORISTA</b></td><td>{{DriverName}}</td></tr>
                <tr><td><b>TIPO DE SERVIÇO</b></td><td>TURISMO</td></tr>
                <tr><td><b>VEÍCULO</b></td><td>{{VehicleInfo}}</td></tr>
                <tr><td><b>INÍCIO</b></td><td>{{TripDate}}</td></tr>
                <tr><td><b>ROTEIRO</b></td><td>{{Route}}</td></tr>
                <tr><td><b>DISTÂNCIA PREVISTA</b></td><td>{{DistanceKm}}</td></tr>
                <tr><td><b>QUANTIDADE DE PASSAGEIROS</b></td><td>{{PassengerCount}}</td></tr>
                {{CommissionRow}}
              </tbody>
            </table>

            <h2>Atenção: informações importantes</h2>
            <table>
              <tbody>
                <tr><td style="width:50%">KM INICIAL:</td><td style="width:50%">KM FINAL:</td></tr>
                <tr><td>HORÁRIO DE INÍCIO NO CLIENTE:</td><td>HORÁRIO DE TÉRMINO NO CLIENTE:</td></tr>
                <tr><td colspan="2">ABASTECIMENTO NA GARAGEM: __________ LITROS</td></tr>
              </tbody>
            </table>

            <p>- Favor abastecer o veículo com água mineral. Verificar todos os equipamentos eletrônicos,
              principalmente o microfone.</p>
            <p>- Ler atentamente os dados da Ordem de Serviço, incluindo as observações. Em caso de dúvidas,
              entrar em contato com o escritório.</p>
            <p>- Apresentar-se com no mínimo 15 minutos de antecedência do horário marcado na Ordem de
              Serviço, sempre uniformizado.</p>
            <p>- Todo início de atendimento em qualquer ponto da cidade, comunicar ao responsável que já se
              encontra próximo do local. Caso não haja comunicação, entrar em contato com o escritório pelo
              telefone {{CompanyWhatsapp}} ({{CompanyContactName}}).</p>
            <p>- Qualquer divergência entre os dados da Ordem de Serviço e a solicitação do cliente, nos
              comunicar imediatamente.</p>
            <p>- Tenha bom senso e dirija com consciência.</p>

            <div class="signature-block">
              <div class="signature-column">
                <div class="signature-line">Assinatura do Motorista</div>
              </div>
              <div class="signature-column">
                <img class="signature-image" src="{{CompanySignaturePath}}" alt="Assinatura" /><br/>
                <div class="signature-line">{{CompanyLegalName}}</div>
              </div>
            </div>
            """;

        private const string SalesOrderTemplate = """
            <h1>PEDIDO DE VENDA</h1>
            <p class="doc-number">N°. {{OrderNumber}}</p>
            <table>
              <tbody>
                <tr><td style="width:30%"><b>CLIENTE</b></td><td>{{ClientName}}</td></tr>
                <tr><td><b>CNPJ/CPF</b></td><td>{{ClientDocument}}</td></tr>
                <tr><td><b>ENDEREÇO</b></td><td>{{ClientAddress}}</td></tr>
                <tr><td><b>DATA</b></td><td>{{OrderDate}}</td></tr>
              </tbody>
            </table>

            <h2>Produtos</h2>
            <table>
              <thead>
                <tr><th>Descrição</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Total</th></tr>
              </thead>
              <tbody>{{ProductRows}}</tbody>
            </table>
            <table>
              <tbody>
                <tr><td style="width:70%"><b>Valor Total</b></td><td>{{TotalPrice}}</td></tr>
                <tr><td><b>Forma de Pagamento</b></td><td>{{PaymentMethod}}</td></tr>
              </tbody>
            </table>

            <p>Dúvidas e informações adicionais podem ser tratadas diretamente com
              {{CompanyContactName}}, pelo telefone {{CompanyWhatsapp}}.</p>

            {{SignatureBlock}}
            """;
    }
}
