using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class FeatureToggleService : IFeatureToggleService
    {
        #region Properties

        /// <summary>
        /// FeatureToggleService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        private readonly IRepository<FeatureToggle> _repository;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// FeatureToggleService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<FeatureToggle> object used to initialize the internal variable using Dependency Injection.</param>
        public FeatureToggleService(IRepository<FeatureToggle> repository, ILogService logService)
        {
            _repository = repository;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<FeatureToggle>>> FindAll()
        {
            WebApiResponse<IEnumerable<FeatureToggle>> result = new();

            try
            {
                var featureToggles = await _repository.GetAllAsync();

                result.Data = featureToggles;
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "FeatureToggleService.FindAll", null);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Feature Toggle na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<FeatureToggle>> FindByKey(string key)
        {
            WebApiResponse<FeatureToggle> result = new();

            try
            {
                var featureToggle = await _repository.FirstOrDefaultAsync(f => f.Key == key);

                result.Data = featureToggle;
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Feature Toggle {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Feature Toggle com a chave {key} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "FeatureToggleService.FindByKey", key);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível buscar o Feature Toggle pela chave {key}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<FeatureToggle>> SetEnabled(string key, bool enabled)
        {
            WebApiResponse<FeatureToggle> result = new();

            try
            {
                var featureToggle = await _repository.FirstOrDefaultAsync(f => f.Key == key);

                if (featureToggle == null)
                {
                    result.Status = ResponseStatus.Warning;
                    result.Message = $"Nenhum Feature Toggle com a chave {key} foi encontrado.";
                    return result;
                }

                featureToggle.Enabled = enabled;
                await _repository.UpdateAsync(featureToggle);

                result.Data = featureToggle;
                result.Status = ResponseStatus.Success;
                result.Message = $"Módulo {featureToggle.Name} {(enabled ? "ativado" : "desativado")} com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "FeatureToggleService.SetEnabled", key);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar o Feature Toggle {key}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<bool> IsEnabledAsync(string key)
        {
            try
            {
                var featureToggle = await _repository.FirstOrDefaultAsync(f => f.Key == key);
                return featureToggle?.Enabled ?? true;
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "FeatureToggleService.IsEnabledAsync", key);
                return true;
            }
        }

        #endregion Public methods
    }
}
