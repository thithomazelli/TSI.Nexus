using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class DocumentTemplateService : IDocumentTemplateService
    {
        #region Properties

        /// <summary>
        /// DocumentTemplateService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        private readonly IRepository<DocumentTemplate> _repository;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// DocumentTemplateService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<DocumentTemplate> object used to initialize the internal variable using Dependency Injection.</param>
        public DocumentTemplateService(IRepository<DocumentTemplate> repository, ILogService logService)
        {
            _repository = repository;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<DocumentTemplate>> Add(DocumentTemplate documentTemplate)
        {
            WebApiResponse<DocumentTemplate> result = new();

            try
            {
                if (await _repository.AnyAsync(d => d.Type == documentTemplate.Type))
                {
                    result.Status = ResponseStatus.Warning;
                    result.Message =
                        $"Já existe um template cadastrado para o tipo {documentTemplate.Type}.";
                    return result;
                }

                await _repository.AddAsync(documentTemplate);

                result.Data = documentTemplate;
                result.Status = ResponseStatus.Success;
                result.Message = $"Template {documentTemplate.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.Add", documentTemplate);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Template {documentTemplate?.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<DocumentTemplate>> Update(
            DocumentTemplate documentTemplate
        )
        {
            WebApiResponse<DocumentTemplate> result = new();

            try
            {
                await _repository.UpdateAsync(documentTemplate);

                result.Data = documentTemplate;
                result.Status = ResponseStatus.Success;
                result.Message = $"Template {documentTemplate.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.Update", documentTemplate);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar o Template {documentTemplate?.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<DocumentTemplate>> Remove(
            DocumentTemplate documentTemplate
        )
        {
            WebApiResponse<DocumentTemplate> result = new();

            try
            {
                await _repository.RemoveAsync(documentTemplate);

                result.Data = documentTemplate;
                result.Status = ResponseStatus.Success;
                result.Message = $"Template {documentTemplate.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.Remove", documentTemplate);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Template {documentTemplate?.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<DocumentTemplate>> FindById(Guid? id)
        {
            WebApiResponse<DocumentTemplate> result = new();

            try
            {
                var documentTemplate = await _repository.GetByIdAsync(id);

                result.Data = documentTemplate;
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Template {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Template com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.FindById", id);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Template na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<DocumentTemplate>>> FindAll()
        {
            WebApiResponse<IEnumerable<DocumentTemplate>> result = new();

            try
            {
                var documentTemplates = await _repository.GetAllAsync();

                result.Data = documentTemplates;
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.FindAll", null);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Template na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<DocumentTemplate>> FindByType(DocumentTemplateType type)
        {
            WebApiResponse<DocumentTemplate> result = new();

            try
            {
                var documentTemplate = await _repository.FirstOrDefaultAsync(d => d.Type == type);

                result.Data = documentTemplate;
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Template {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Template cadastrado para o tipo {type}";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.FindByType", type);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar o Template do tipo {type}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<DocumentTemplate>> UploadContent(
            DocumentTemplateType type,
            string fileName,
            string content
        )
        {
            WebApiResponse<DocumentTemplate> result = new();

            try
            {
                var documentTemplate = await _repository.FirstOrDefaultAsync(d => d.Type == type);

                if (documentTemplate == null)
                {
                    result.Status = ResponseStatus.Warning;
                    result.Message = $"Nenhum Template cadastrado para o tipo {type}.";
                    return result;
                }

                documentTemplate.FileName = fileName;
                documentTemplate.Content = content;

                await _repository.UpdateAsync(documentTemplate);

                result.Data = documentTemplate;
                result.Status = ResponseStatus.Success;
                result.Message = $"Template {documentTemplate.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DocumentTemplateService.UploadContent", type);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar o Template do tipo {type}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods
    }
}
